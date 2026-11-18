
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

// Resolve platform-specific static binaries.
// Environment variables take priority when explicitly configured.
const ffmpegStaticPath = require('ffmpeg-static') as string | null;
const ffprobeStaticPath = (require('ffprobe-static') as { path?: string }).path;

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
        const result = execSync(
          `if exist "${testPath}" (echo exists)`,
          {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
            shell: 'cmd.exe',
          }
        ).trim();

        if (result === 'exists') {
          console.log(`[FFmpeg] Found ${binaryName} at: ${testPath}`);
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
        console.log(`[FFmpeg] Found ${binaryName} via PATH: ${firstPath}`);
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
          console.log(`[FFmpeg] Found ${binaryName} at: ${testPath}`);
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
        console.log(`[FFmpeg] Found ${binaryName} via PATH: ${result}`);
        return result;
      }
    } catch {
      console.log(`[FFmpeg] PATH lookup failed for ${binaryName}`);
    }
  }

  console.warn(`[FFmpeg] Using binary name as fallback: ${binaryName}`);
  return binaryName;
}

const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  ffmpegStaticPath ||
  detectBinaryPath('ffmpeg');

const FFPROBE_PATH =
  process.env.FFPROBE_PATH ||
  ffprobeStaticPath ||
  detectBinaryPath('ffprobe');

console.log('[FFmpeg] Configured paths:', {
  FFMPEG_PATH,
  FFPROBE_PATH,
});

// Configure fluent-ffmpeg.
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

// Runtime validation.
function validateFFmpegInstallation(): {
  isValid: boolean;
  details: string;
} {
  const errors: string[] = [];

  try {
    execSync(`"${FFMPEG_PATH}" -version`, {
      stdio: 'ignore',
      timeout: 5000,
    });
    console.log(`[FFmpeg] ffmpeg is working (${FFMPEG_PATH})`);
  } catch (error: any) {
    const errorMsg = `ffmpeg not executable at: ${FFMPEG_PATH}`;
    console.error(`[FFmpeg] ${errorMsg}`, error.message);
    errors.push(errorMsg);
  }

  try {
    execSync(`"${FFPROBE_PATH}" -version`, {
      stdio: 'ignore',
      timeout: 5000,
    });
    console.log(`[FFmpeg] ffprobe is working (${FFPROBE_PATH})`);
  } catch (error: any) {
    const errorMsg = `ffprobe not executable at: ${FFPROBE_PATH}`;
    console.error(`[FFmpeg] ${errorMsg}`, error.message);
    errors.push(errorMsg);
  }

  if (errors.length > 0) {
    const details =
      `FFmpeg not available:\n\n${errors.join('\n')}\n\n` +
      `Configured FFmpeg path: ${FFMPEG_PATH}\n` +
      `Configured FFprobe path: ${FFPROBE_PATH}\n\n` +
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
    console.error('[FFmpeg] Validation error:', error);
    return false;
  }
}

export function getFFmpegValidationDetails(): string {
  try {
    return validateFFmpegInstallation().details;
  } catch (error: any) {
    return `FFmpeg validation error: ${error.message}`;
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
        if (
          err.message &&
          (err.message.includes('ENOENT') || err.message.includes('spawn'))
        ) {
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

  console.log(
    `[Compress] Current size: ${currentSizeMB.toFixed(2)}MB, target: ${targetSizeMB}MB`
  );

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

  console.log(
    `[Compress] Compressing with ${bitrate}kbps (duration: ${duration.toFixed(2)}s)`
  );

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

export async function getAudioMetadata(
  filePath: string
): Promise<{
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
        const audioStream = metadata.streams.find(
          (s) => s.codec_type === 'audio'
        );

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
  const dir = path.join(
    outputRoot,
    `chunks_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );

  await fs.mkdir(dir, { recursive: true });

  const pattern = path.join(dir, 'chunk_%03d.mp3');

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate(64)
      .audioCodec('libmp3lame')
      .outputOptions([
        '-f',
        'segment',
        '-segment_time',
        String(chunkSeconds),
        '-reset_timestamps',
        '1',
      ])
      .on('end', () => resolve())
      .on('error', (err) => {
        reject(new Error(`Audio chunking failed: ${err.message}`));
      })
      .save(pattern);
  });

  const files = (await fs.readdir(dir))
    .filter((file) => file.endsWith('.mp3'))
    .sort();

  if (files.length === 0) {
    throw new Error('No audio found (file may be silent)');
  }

  return {
    dir,
    chunks: files.map((file, index) => ({
      path: path.join(dir, file),
      offsetSeconds: index * chunkSeconds,
    })),
  };
}
