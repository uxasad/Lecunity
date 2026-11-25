import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

// Resolve platform-specific static binaries.
// Environment variables take priority when explicitly configured.
const ffmpegStaticPath = process.env.FFMPEG_PATH || (require('ffmpeg-static') as string | null);

const ffprobeStaticPath =
  process.env.FFPROBE_PATH || (require('ffprobe-static') as { path?: string }).path;

// Auto-detect FFmpeg and FFprobe paths as a fallback.
function detectBinaryPath(binaryName: string): string {
  console.log(`[FFmpeg] Detecting ${binaryName}...`);

  // Windows-specific fallback paths.
  if (process.platform === 'win32') {
    const windowsPaths = [
      `C:\\ffmpeg\\bin\\${binaryName}.exe`,
      `C:\\Program Files\\ffmpeg\\bin\\${binaryName}.exe`,
    ];

    for (const testPath of windowsPaths) {
      try {
        const result = execSync(`if exist "${testPath}" (echo exists)`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
          shell: 'cmd.exe',
        }).trim();

        if (result === 'exists') {
          console.log(`[FFmpeg] Found ${binaryName} executable`);
          return testPath;
        }
      } catch {
        // Try the next path.
      }
    }

    try {
      const result = execSync(`where ${binaryName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      const firstPath = result.split(/\r?\n/)[0];

      if (firstPath) {
        console.log(`[FFmpeg] Found ${binaryName} on PATH`);
        return firstPath;
      }
    } catch {
      console.log(`[FFmpeg] Windows PATH lookup failed for ${binaryName}`);
    }
  } else {
    // Common macOS and Linux locations.
    const commonPaths = [
      `/opt/homebrew/bin/${binaryName}`,
      `/usr/local/bin/${binaryName}`,
      `/usr/bin/${binaryName}`,
      `/opt/local/bin/${binaryName}`,
    ];

    for (const testPath of commonPaths) {
      try {
        const result = execSync(`test -f "${testPath}" && echo exists`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();

        if (result === 'exists') {
          console.log(`[FFmpeg] Found ${binaryName} executable`);
          return testPath;
        }
      } catch {
        // Try the next path.
      }
    }

    try {
      const result = execSync(`which ${binaryName}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (result) {
        console.log(`[FFmpeg] Found ${binaryName} on PATH`);
        return result;
      }
    } catch {
      console.log(`[FFmpeg] PATH lookup failed for ${binaryName}`);
    }
  }

  console.warn(`[FFmpeg] Using ${binaryName} executable name as fallback`);
  return binaryName;
}

const FFMPEG_PATH = process.env.FFMPEG_PATH || ffmpegStaticPath || detectBinaryPath('ffmpeg');

const FFPROBE_PATH = process.env.FFPROBE_PATH || ffprobeStaticPath || detectBinaryPath('ffprobe');

// Configure fluent-ffmpeg.
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

const FFMPEG_VALIDATION_TIMEOUT_MS = 5000;

export interface FFmpegValidationResult {
  isValid: boolean;
  details: string;
}

function safeProcessField(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    return /^[A-Za-z0-9_.-]{1,80}$/.test(value) ? value : 'redacted';
  }

  return 'unknown';
}

function describeProcessError(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'process execution failed';
  }

  const failure = error as {
    code?: unknown;
    status?: unknown;
    signal?: unknown;
    killed?: unknown;
  };
  const details: string[] = [];

  if (failure.code !== undefined && failure.code !== null) {
    details.push(`code=${safeProcessField(failure.code)}`);
  }
  if ('status' in failure) {
    details.push(
      `exitStatus=${failure.status === null ? 'none' : safeProcessField(failure.status)}`
    );
  }
  if ('signal' in failure) {
    details.push(`signal=${failure.signal === null ? 'none' : safeProcessField(failure.signal)}`);
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (failure.killed === true || failure.code === 'ETIMEDOUT' || message.includes('timed out')) {
    details.push(`timedOut=true (${FFMPEG_VALIDATION_TIMEOUT_MS}ms)`);
  }

  return details.length > 0 ? details.join(', ') : 'process execution failed';
}

export function validateFFmpegInstallation(): FFmpegValidationResult {
  const errors: string[] = [];

  try {
    execSync(`"${FFMPEG_PATH}" -version`, {
      stdio: 'ignore',
      timeout: FFMPEG_VALIDATION_TIMEOUT_MS,
    });
    console.log('[FFmpeg] ffmpeg is working');
  } catch (error) {
    const errorDetails = describeProcessError(error);
    const errorMessage = `ffmpeg validation failed (${errorDetails})`;
    console.error(`[FFmpeg] ${errorMessage}`);
    errors.push(errorMessage);
  }

  try {
    execSync(`"${FFPROBE_PATH}" -version`, {
      stdio: 'ignore',
      timeout: FFMPEG_VALIDATION_TIMEOUT_MS,
    });
    console.log('[FFmpeg] ffprobe is working');
  } catch (error) {
    const errorDetails = describeProcessError(error);
    const errorMessage = `ffprobe validation failed (${errorDetails})`;
    console.error(`[FFmpeg] ${errorMessage}`);
    errors.push(errorMessage);
  }

  if (errors.length > 0) {
    const details =
      `FFmpeg not available:\n\n${errors.join('\n')}\n\n` +
      `Check that ffmpeg-static and ffprobe-static are installed ` +
      `and their binaries are available for the current platform.`;

    return { isValid: false, details };
  }

  return {
    isValid: true,
    details: 'FFmpeg and FFprobe are available and working',
  };
}

// Export validation functions.
export function checkFFmpegAvailable(): boolean {
  try {
    return validateFFmpegInstallation().isValid;
  } catch (error) {
    console.error(`[FFmpeg] Validation error (${describeProcessError(error)})`);
    return false;
  }
}

export function getFFmpegValidationDetails(): string {
  try {
    return validateFFmpegInstallation().details;
  } catch (error) {
    return `FFmpeg validation error (${describeProcessError(error)})`;
  }
}

export interface AudioExtractionResult {
  audioPath: string;
  duration: number;
  format: string;
}

export async function extractAudioFromVideo(
  videoPath: string,
  outputDir: string = '/tmp'
): Promise<AudioExtractionResult> {
  const outputFilename = `${Date.now()}_extracted_audio.mp3`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.mkdir(outputDir, { recursive: true });

  const videoStats = await fs.stat(videoPath);
  const videoSizeMB = videoStats.size / (1024 * 1024);

  let bitrate = 48;

  if (videoSizeMB < 100) {
    bitrate = 64;
  }

  console.log(
    `[FFmpeg] Video size: ${videoSizeMB.toFixed(2)}MB, using ${bitrate}kbps audio bitrate`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .toFormat('mp3')
      .audioBitrate(bitrate)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .on('start', (cmd) => {
        console.log(`[FFmpeg] Starting extraction: ${cmd}`);
      })
      .on('end', async () => {
        try {
          const duration = await getAudioDuration(outputPath);

          const stats = await fs.stat(outputPath);
          const fileSizeMB = stats.size / (1024 * 1024);

          console.log(
            `[FFmpeg] Extracted audio: ${fileSizeMB.toFixed(2)}MB, duration: ${duration.toFixed(2)}s`
          );

          if (fileSizeMB > 25) {
            await fs.unlink(outputPath).catch(() => {});

            reject(
              new Error(
                `Extracted audio is ${fileSizeMB.toFixed(2)}MB, exceeds 25MB limit. ` +
                  `Please use a shorter video.`
              )
            );
            return;
          }

          if (fileSizeMB > 10) {
            console.warn(
              `[FFmpeg] Warning: Audio file is ${fileSizeMB.toFixed(2)}MB, may cause upload issues`
            );
          }

          resolve({
            audioPath: outputPath,
            duration,
            format: 'mp3',
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg extraction failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        if (err.message && (err.message.includes('ENOENT') || err.message.includes('spawn'))) {
          reject(
            new Error(
              `FFprobe binary not found.\n` +
                `Current ffprobe path: ${FFPROBE_PATH}\n` +
                `Check the ffprobe-static installation.`
            )
          );
        } else {
          reject(new Error(`Failed to probe audio file: ${err.message}`));
        }
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

export async function convertAudioFormat(
  inputPath: string,
  outputFormat: string = 'mp3',
  outputDir: string = '/tmp'
): Promise<string> {
  const outputFilename = `${Date.now()}_converted.${outputFormat}`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(outputFormat)
      .audioBitrate(48)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

/**
 * Compress audio file to target size if needed.
 * Attempts to create a file under targetSizeMB.
 */
export async function compressAudioIfNeeded(
  inputPath: string,
  targetSizeMB: number = 10,
  outputDir: string = '/tmp'
): Promise<string> {
  const stats = await fs.stat(inputPath);
  const currentSizeMB = stats.size / (1024 * 1024);

  console.log(`[Compress] Current size: ${currentSizeMB.toFixed(2)}MB, target: ${targetSizeMB}MB`);

  if (currentSizeMB <= targetSizeMB) {
    console.log('[Compress] File already within target size');
    return inputPath;
  }

  const outputFilename = `${Date.now()}_compressed.mp3`;
  const outputPath = path.join(outputDir, outputFilename);

  await fs.mkdir(outputDir, { recursive: true });

  const duration = await getAudioDuration(inputPath);

  if (duration <= 0) {
    throw new Error('Cannot compress audio: invalid or zero duration');
  }

  const targetBitrate = Math.floor((targetSizeMB * 8192) / duration);
  const bitrate = Math.max(32, Math.min(targetBitrate, 64));

  console.log(`[Compress] Compressing with ${bitrate}kbps (duration: ${duration.toFixed(2)}s)`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioBitrate(bitrate)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('libmp3lame')
      .on('end', async () => {
        try {
          const newStats = await fs.stat(outputPath);
          const newSizeMB = newStats.size / (1024 * 1024);

          console.log(`[Compress] Compressed to ${newSizeMB.toFixed(2)}MB`);
          resolve(outputPath);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => {
        reject(new Error(`Audio compression failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filePath}:`, error);
  }
}

export async function getAudioMetadata(filePath: string): Promise<{
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get audio metadata: ${err.message}`));
      } else {
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration || 0,
          bitrate: metadata.format.bit_rate || 0,
          sampleRate: audioStream?.sample_rate || 0,
          channels: audioStream?.channels || 0,
        });
      }
    });
  });
}

export interface AudioChunk {
  path: string;
  offsetSeconds: number;
}

function sanitizeFfmpegDiagnostic(value: string, paths: string[] = []): string {
  let sanitized = value;

  for (const filePath of paths) {
    if (filePath) {
      sanitized = sanitized
        .split(filePath)
        .join('[path]')
        .split(filePath.replace(/\\/g, '/'))
        .join('[path]');
    }
  }

  return sanitized
    .replace(/(https?:\/\/)[^\s/@]+@[^\s/]+/gi, '$1[redacted]@')
    .replace(
      /([?&](?:access_token|api_key|key|password|signature|token)=)[^&\s]+/gi,
      '$1[redacted]'
    );
}

interface ProbedAudioStream {
  index: number;
  codec: string;
  channels: number;
  sampleRate: number;
}

async function getAudioStreamInfo(inputPath: string): Promise<ProbedAudioStream> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (error, metadata) => {
      if (error) {
        const detail = sanitizeFfmpegDiagnostic(error.message, [inputPath]).slice(-2000);
        reject(
          new Error(
            `Input media is invalid or corrupted; ffprobe could not inspect an audio stream. ${detail}`
          )
        );
        return;
      }

      const audioStreams = metadata.streams.filter((stream) => stream.codec_type === 'audio');

      if (audioStreams.length === 0) {
        reject(new Error('Input media contains no usable audio stream.'));
        return;
      }

      const audioStream = audioStreams.find((stream) => {
        const channels = Number(stream.channels);
        const sampleRate = Number(stream.sample_rate);
        return (
          Number.isSafeInteger(stream.index) &&
          typeof stream.codec_name === 'string' &&
          stream.codec_name.length > 0 &&
          stream.codec_name !== 'unknown' &&
          Number.isSafeInteger(channels) &&
          channels > 0 &&
          Number.isSafeInteger(sampleRate) &&
          sampleRate > 0
        );
      });

      if (!audioStream || !audioStream.codec_name) {
        const firstStream = audioStreams[0];
        reject(
          new Error(
            `Input audio stream has invalid parameters (codec=${firstStream.codec_name || 'unknown'}, channels=${firstStream.channels ?? 'unknown'}, sampleRate=${firstStream.sample_rate ?? 'unknown'}).`
          )
        );
        return;
      }

      const streamInfo = {
        index: audioStream.index,
        codec: audioStream.codec_name,
        channels: Number(audioStream.channels),
        sampleRate: Number(audioStream.sample_rate),
      };
      console.log('[FFmpeg] Probed audio stream', streamInfo);
      resolve(streamInfo);
    });
  });
}

function runFfmpegWithDiagnostics(
  command: ReturnType<typeof ffmpeg>,
  outputPath: string,
  operation: string,
  paths: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    let commandLine = '';
    const stderrLines: string[] = [];

    command
      .on('start', (cmd) => {
        commandLine = sanitizeFfmpegDiagnostic(cmd, paths);
      })
      .on('stderr', (line) => {
        stderrLines.push(line);
        if (stderrLines.length > 40) {
          stderrLines.shift();
        }
      })
      .on('end', () => resolve())
      .on('error', (error) => {
        const stderr = sanitizeFfmpegDiagnostic(
          stderrLines.length ? stderrLines.join('\n') : error.message,
          paths
        ).slice(-6000);
        const processError = sanitizeFfmpegDiagnostic(error.message, paths);
        reject(
          new Error(
            `${operation} failed.\nCommand: ${commandLine || '[unavailable]'}\nFFmpeg error: ${processError}\nFFmpeg stderr:\n${stderr}`
          )
        );
      })
      .save(outputPath);
  });
}

/**
 * Prep for transcription: mono 16kHz 64kbps MP3,
 * split into fixed-length chunks so every request stays
 * below the 25MB upload cap.
 */
export async function prepareAudioChunks(
  inputPath: string,
  chunkSeconds: number = 600,
  outputRoot: string = '/tmp'
): Promise<{ chunks: AudioChunk[]; dir: string }> {
  let inputStats;

  try {
    inputStats = await fs.stat(inputPath);
  } catch (error) {
    const detail =
      error instanceof Error
        ? sanitizeFfmpegDiagnostic(error.message, [inputPath])
        : 'Unknown filesystem error';
    throw new Error(`Unable to access audio input file: ${detail}`);
  }

  if (!inputStats.isFile()) {
    throw new Error('Audio chunking input must be a file.');
  }

  if (inputStats.size === 0) {
    throw new Error('Audio chunking input file is empty.');
  }

  const audioStream = await getAudioStreamInfo(inputPath);
  const dir = path.join(
    outputRoot,
    `chunks_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );

  await fs.mkdir(dir, { recursive: true });

  const pattern = path.join(dir, 'chunk_%03d.mp3');

  try {
    const preflightPath = path.join(dir, 'audio_preflight.pcm');
    await runFfmpegWithDiagnostics(
      ffmpeg(inputPath)
        .noVideo()
        .outputOptions([
          '-map',
          `0:${audioStream.index}`,
          '-frames:a',
          '1',
          '-xerror',
          '-acodec',
          'pcm_s16le',
          '-f',
          's16le',
        ]),
      preflightPath,
      'Audio decode preflight',
      [inputPath, dir, preflightPath]
    );

    const preflightStats = await fs.stat(preflightPath);
    if (!preflightStats.isFile() || preflightStats.size === 0) {
      throw new Error('Input media contains no decodable audio frames.');
    }

    await fs.unlink(preflightPath);
    console.log('[FFmpeg] Audio decode preflight passed', {
      decodedBytes: preflightStats.size,
    });

    await runFfmpegWithDiagnostics(
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .audioBitrate(64)
        .audioCodec('libmp3lame')
        .outputOptions([
          '-map',
          `0:${audioStream.index}`,
          '-f',
          'segment',
          '-segment_time',
          String(chunkSeconds),
          '-reset_timestamps',
          '1',
        ]),
      pattern,
      'Audio chunking',
      [inputPath, dir, pattern]
    );

    const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.mp3')).sort();

    if (files.length === 0) {
      throw new Error('No audio chunks were produced.');
    }

    return {
      dir,
      chunks: files.map((file, index) => ({
        path: path.join(dir, file),
        offsetSeconds: index * chunkSeconds,
      })),
    };
  } catch (error) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error(
        `[FFmpeg] Failed to clean temporary chunk directory: ${
          cleanupError instanceof Error
            ? sanitizeFfmpegDiagnostic(cleanupError.message, [dir])
            : 'Unknown cleanup error'
        }`
      );
    }

    throw error;
  }
}
