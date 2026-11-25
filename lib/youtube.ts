import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const execFilePromise = promisify(execFile);
const ffmpegStaticPath = process.env.FFMPEG_PATH || (require('ffmpeg-static') as string | null);

const ffprobeStaticPath =
  process.env.FFPROBE_PATH || (require('ffprobe-static') as { path?: string }).path;
const youtubeHosts = new Set(['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com']);
const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const maxYoutubeAudioSizeMb = Number(process.env.MAX_YOUTUBE_MB) || 50;
const maxYoutubeAudioSizeBytes = maxYoutubeAudioSizeMb * 1024 * 1024;

function sanitizeDiagnostic(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[redacted-url]')
    .replace(
      /\b(authorization|proxy-authorization|cookie|set-cookie)\s*[:=]\s*[^\r\n]*/gi,
      '$1=[redacted]'
    )
    .replace(
      /([?&](?:access_token|api_key|key|password|signature|token)=)[^&\s]+/gi,
      '$1[redacted]'
    );
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function isCrossDeviceLink(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EXDEV';
}

async function cleanupYoutubeArtifacts(
  uploadsDir: string,
  outputPrefix: string,
  keepPath?: string
): Promise<void> {
  const files = await fs.readdir(uploadsDir).catch((error: unknown) => {
    if (isNotFound(error)) return [];
    throw error;
  });

  for (const file of files) {
    if (!file.startsWith(`${outputPrefix}.`)) continue;

    const filePath = path.join(uploadsDir, file);
    if (keepPath && path.resolve(filePath) === path.resolve(keepPath)) {
      continue;
    }

    await fs.rm(filePath, { force: true, recursive: true });
  }
}

async function createFfmpegToolsDirectory(
  uploadsDir: string,
  outputPrefix: string
): Promise<string> {
  if (!ffmpegStaticPath || !ffprobeStaticPath) {
    throw new Error('FFmpeg or FFprobe binary path is unavailable from the static packages.');
  }

  const toolsDirectory = await fs.mkdtemp(path.join(uploadsDir, `${outputPrefix}.ffmpeg-`));
  const binaryExtension = process.platform === 'win32' ? '.exe' : '';
  const linkedFfmpegPath = path.join(toolsDirectory, `ffmpeg${binaryExtension}`);
  const linkedFfprobePath = path.join(toolsDirectory, `ffprobe${binaryExtension}`);

  try {
    await fs.link(ffmpegStaticPath, linkedFfmpegPath);
  } catch (error) {
    if (!isCrossDeviceLink(error)) throw error;
    await fs.copyFile(ffmpegStaticPath, linkedFfmpegPath);
  }

  try {
    await fs.link(ffprobeStaticPath, linkedFfprobePath);
  } catch (error) {
    if (!isCrossDeviceLink(error)) throw error;
    await fs.copyFile(ffprobeStaticPath, linkedFfprobePath);
  }

  return toolsDirectory;
}

export interface YoutubeDownloadResult {
  audioPath: string;
  title: string;
  duration?: number;
}

/**
 * Check if yt-dlp is installed
 */
export async function checkYtDlpInstalled(): Promise<boolean> {
  try {
    await execFilePromise('yt-dlp', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download audio from YouTube video using yt-dlp
 * Returns path to downloaded audio file
 */
export async function downloadYoutubeAudio(url: string): Promise<YoutubeDownloadResult> {
  if (!isValidYoutubeUrl(url)) {
    throw new Error('Invalid YouTube URL');
  }

  // Check if yt-dlp is installed
  const isInstalled = await checkYtDlpInstalled();
  if (!isInstalled) {
    throw new Error(
      'yt-dlp is not installed. Please install it:\n' +
        'macOS: brew install yt-dlp\n' +
        'Linux: sudo apt install yt-dlp or pip install yt-dlp\n' +
        'Windows: winget install yt-dlp or pip install yt-dlp'
    );
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const outputPrefix = `youtube_${timestamp}_${randomUUID().slice(0, 8)}`;
  const outputTemplate = path.join(uploadsDir, outputPrefix);

  try {
    console.log('[YouTube] Starting audio download');

    // Use yt-dlp to download audio only
    // -x: extract audio
    // --audio-format mp3: convert to mp3
    // --audio-quality 0: best quality
    // -o: output template (without extension - yt-dlp will add .mp3)
    // --max-filesize: enforce the configured limit to avoid extremely long videos
    // --no-playlist: only download single video, not playlist
    // --newline: output newlines for easier parsing
    // --no-simulate: actually download (not just simulate)
    let stdout: string;
    let stderr: string;

    try {
      const ffmpegToolsDirectory = await createFfmpegToolsDirectory(uploadsDir, outputPrefix);

      const result = await execFilePromise(
        'yt-dlp',
        [
          '-x',
          '--audio-format',
          'mp3',
          '--audio-quality',
          '0',
          '--max-filesize',
          `${maxYoutubeAudioSizeMb}M`,
          '--no-playlist',
          '--newline',
          '--no-simulate',
          '--ffmpeg-location',
          path.join(ffmpegToolsDirectory, `ffmpeg${process.platform === 'win32' ? '.exe' : ''}`),
          '-o',
          `${outputTemplate}.%(ext)s`,
          '--print',
          'title',
          '--print',
          'duration',
          '--',
          url,
        ],
        {
          maxBuffer: 50 * 1024 * 1024, // 50MB buffer for longer output
          timeout: 5 * 60 * 1000, // 5 minutes timeout for long videos
        }
      );
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: unknown) {
      const details =
        typeof execError === 'object' && execError !== null
          ? (execError as Record<string, unknown>)
          : {};
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown yt-dlp error';
      const errorStderr = typeof details.stderr === 'string' ? details.stderr : '';
      const lowerStderr = errorStderr.toLowerCase();

      // Check if it's a timeout
      if (details.killed && details.signal === 'SIGTERM') {
        throw new Error('Download timeout (video too long). Try a shorter video.');
      }
      // Check if it's a filesize limit
      if (
        lowerStderr.includes('max-filesize') &&
        /too large|larger than|exceeds? (?:the )?limit/.test(lowerStderr)
      ) {
        throw new Error(`Video is too large (>${maxYoutubeAudioSizeMb}MB). Try a shorter video.`);
      }
      // Check if video is unavailable or private
      if (lowerStderr.includes('private video') || lowerStderr.includes('unavailable')) {
        throw new Error('Video is private or unavailable');
      }

      throw new Error(
        `yt-dlp error: ${sanitizeDiagnostic(errorStderr || errorMessage || 'Unknown error')}`
      );
    }

    if (stderr) {
      // Check for warnings that might indicate issues
      if (stderr.includes('ERROR')) {
        throw new Error(`yt-dlp error in stderr: ${sanitizeDiagnostic(stderr)}`);
      }
    }

    // Parse output: title, duration (no filepath in output)
    const lines = stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim());

    const title = lines[0]?.trim() || 'YouTube Video';
    const durationStr = lines[1]?.trim();
    const duration = durationStr ? parseFloat(durationStr) : undefined;

    // Wait a bit for file system to sync (especially on macOS)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const extensions = ['.mp3', '.webm', '.m4a', '.opus', '.ogg', '.aac'];
    let finalAudioPath: string | null = null;

    for (const ext of extensions) {
      const testPath = `${outputTemplate}${ext}`;
      try {
        const stats = await fs.stat(testPath);
        if (stats.isFile() && stats.size > 0) {
          finalAudioPath = testPath;
          break;
        }
      } catch (error) {
        if (!isNotFound(error)) {
          throw error;
        }
      }
    }

    if (!finalAudioPath) {
      throw new Error('yt-dlp completed without producing a nonempty audio file.');
    }

    const finalStats = await fs.stat(finalAudioPath);
    if (finalStats.size > maxYoutubeAudioSizeBytes) {
      throw new Error(`Video is too large (>${maxYoutubeAudioSizeMb}MB). Try a shorter video.`);
    }

    await cleanupYoutubeArtifacts(uploadsDir, outputPrefix, finalAudioPath);
    console.log('[YouTube] Download complete', {
      sourceType: 'youtube',
      extension: path.extname(finalAudioPath).toLowerCase(),
      sizeBytes: finalStats.size,
    });

    return {
      audioPath: finalAudioPath,
      title,
      duration,
    };
  } catch (error) {
    try {
      await cleanupYoutubeArtifacts(uploadsDir, outputPrefix);
    } catch (cleanupError) {
      console.error(
        '[YouTube] Temporary-file cleanup failed',
        sanitizeDiagnostic(
          cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error'
        )
      );
    }

    const detail = sanitizeDiagnostic(
      error instanceof Error ? error.message : 'Unknown download error'
    );
    console.error('[YouTube] Download failed', detail);
    throw new Error(`Failed to download YouTube video: ${detail}`);
  }
}

/**
 * Validate YouTube URL
 */
export function isValidYoutubeUrl(url: string): boolean {
  return getYoutubeVideoId(url) !== null;
}

function extractYoutubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const authority = url.match(/^\s*https:\/\/([^/?#]*)/i)?.[1] ?? '';

    if (
      urlObj.protocol !== 'https:' ||
      !youtubeHosts.has(urlObj.hostname) ||
      urlObj.username ||
      urlObj.password ||
      authority.includes('@') ||
      urlObj.port
    ) {
      return null;
    }

    let videoId: string | null = null;
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1] ?? null;
    } else if (urlObj.pathname === '/watch') {
      const ids = urlObj.searchParams.getAll('v');
      videoId = ids.length === 1 ? ids[0] : null;
    } else {
      videoId =
        urlObj.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})\/?$/)?.[1] ?? null;
    }

    return videoId && youtubeVideoIdPattern.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function getYoutubeVideoId(url: string): string | null {
  return extractYoutubeVideoId(url);
}
