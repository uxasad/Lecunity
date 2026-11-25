import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { pipeline } from 'stream/promises';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';

const MAX_REDIRECTS = 5;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export interface MediaDownloadResult {
  audioPath: string;
  title: string;
  duration?: number;
}

interface DownloadResponse {
  statusCode: number;
  contentType: string;
  bytesReceived: number;
}

function normalizeContentType(contentType?: string): string {
  return contentType?.split(';', 1)[0].trim().toLowerCase() || '';
}

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

function isErrorContentType(contentType: string): boolean {
  return /^(text\/html|text\/json|application\/(?:[^;]+\+)?json|text\/xml|application\/xml)$/.test(
    contentType
  );
}

function isSupportedMediaContentType(contentType: string): boolean {
  return (
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/') ||
    [
      'application/octet-stream',
      'binary/octet-stream',
      'application/download',
      'application/x-download',
      'application/mp4',
      'application/ogg',
      'application/x-matroska',
    ].includes(contentType)
  );
}

function detectErrorBody(prefix: Buffer): string | null {
  const text = prefix
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart();

  if (/^(<!doctype\s+html|<html\b|<head\b|<body\b|<\?xml\b|<error\b)/i.test(text)) {
    return 'Downloaded response contains an HTML or XML error document';
  }

  if (/^(?:\)\]\}',?\s*)?[{[]/.test(text)) {
    return 'Downloaded response contains a JSON document';
  }

  return null;
}

function detectExtension(prefix: Buffer, contentType: string): string | null {
  if (prefix.length >= 2 && prefix[0] === 0xff && (prefix[1] & 0xf6) === 0xf0) {
    return '.aac';
  }

  if (prefix.length >= 12 && prefix.toString('ascii', 0, 3) === 'ID3') {
    return '.mp3';
  }

  if (prefix.length >= 2 && prefix[0] === 0xff && (prefix[1] & 0xe0) === 0xe0) {
    return contentType === 'audio/aac' ? '.aac' : '.mp3';
  }

  if (
    prefix.length >= 12 &&
    prefix.toString('ascii', 0, 4) === 'RIFF' &&
    prefix.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return '.wav';
  }

  if (prefix.toString('ascii', 0, 4) === 'RIFF' && prefix.toString('ascii', 8, 12) === 'AVI ') {
    return '.avi';
  }

  if (prefix.toString('ascii', 0, 4) === 'OggS') {
    return '.ogg';
  }

  if (prefix.length >= 8 && prefix.toString('ascii', 4, 8) === 'ftyp') {
    const brand = prefix.toString('ascii', 8, 12);
    if (contentType === 'video/quicktime') {
      return '.mov';
    }
    if (
      contentType === 'audio/mp4' ||
      contentType === 'audio/x-m4a' ||
      brand === 'M4A ' ||
      brand === 'M4B '
    ) {
      return '.m4a';
    }
    return '.mp4';
  }

  if (
    prefix.length >= 4 &&
    prefix[0] === 0x1a &&
    prefix[1] === 0x45 &&
    prefix[2] === 0xdf &&
    prefix[3] === 0xa3
  ) {
    return contentType.includes('webm') ? '.webm' : '.mkv';
  }

  if (prefix.toString('ascii', 0, 4) === 'fLaC') {
    return '.flac';
  }

  const contentTypeExtensions: Record<string, string> = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/wave': '.wav',
    'audio/x-wav': '.wav',
    'audio/x-m4a': '.m4a',
    'audio/m4a': '.m4a',
    'audio/mp4': '.m4a',
    'audio/aac': '.aac',
    'audio/ogg': '.ogg',
    'audio/flac': '.flac',
    'application/mp4': '.mp4',
    'application/ogg': '.ogg',
    'application/x-matroska': '.mkv',
    'video/mp4': '.mp4',
    'video/x-matroska': '.mkv',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/webm': '.webm',
    'video/mpeg': '.mpeg',
    'video/mp2t': '.ts',
  };

  return contentTypeExtensions[contentType] || null;
}

async function readFilePrefix(filePath: string): Promise<Buffer> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(512);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function discardResponse(response: IncomingMessage): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    response.once('error', reject);
    response.once('aborted', () => reject(new Error('Redirect response was interrupted')));
    response.once('end', resolve);
    response.resume();
  });
}

async function downloadFile(url: string, outputPath: string): Promise<DownloadResponse> {
  let currentUrl = new URL(url);

  for (let redirectCount = 0; ; redirectCount++) {
    const protocol = currentUrl.protocol === 'https:' ? https : http;
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const request = protocol.get(
        currentUrl,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Lecunity/1.0)',
          },
        },
        resolve
      );

      request.on('error', reject);
    });

    if (response.statusCode && REDIRECT_STATUS_CODES.has(response.statusCode)) {
      const location = response.headers.location;
      if (!location) {
        response.destroy();
        throw new Error('Redirect response did not include a location');
      }
      if (redirectCount >= MAX_REDIRECTS) {
        response.destroy();
        throw new Error('Media URL exceeded the redirect limit');
      }

      await discardResponse(response);
      currentUrl = new URL(location, currentUrl);
      if (currentUrl.protocol !== 'http:' && currentUrl.protocol !== 'https:') {
        throw new Error('Media URL redirect used an unsupported protocol');
      }
      continue;
    }

    if (response.statusCode !== 200) {
      const status = response.statusCode || 'unknown';
      response.destroy();
      throw new Error(`Media server returned HTTP ${status}`);
    }

    const contentType = normalizeContentType(response.headers['content-type']);
    if (isErrorContentType(contentType)) {
      response.destroy();
      throw new Error(`Media server returned an error document (${contentType})`);
    }

    const contentLengthHeader = response.headers['content-length'];
    let expectedBytes: number | null = null;
    if (contentLengthHeader !== undefined) {
      const parsedLength = Number(contentLengthHeader);
      if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
        response.destroy();
        throw new Error('Media server returned an invalid Content-Length');
      }
      expectedBytes = parsedLength;
    }

    let bytesReceived = 0;
    response.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
    });

    try {
      await pipeline(response, createWriteStream(outputPath, { flags: 'wx' }));
    } catch (error) {
      throw new Error(
        `Media response was interrupted: ${
          error instanceof Error ? sanitizeDiagnostic(error.message) : 'unknown stream error'
        }`
      );
    }

    if (!response.complete) {
      throw new Error('Media response ended before the HTTP message completed');
    }
    if (expectedBytes !== null && bytesReceived !== expectedBytes) {
      throw new Error(`Incomplete media download (${bytesReceived} of ${expectedBytes} bytes)`);
    }

    return {
      statusCode: response.statusCode || 200,
      contentType,
      bytesReceived,
    };
  }
}

export async function downloadMediaFromUrl(url: string): Promise<MediaDownloadResult> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const downloadId = `${timestamp}_${randomUUID().slice(0, 8)}`;
  const parsedUrl = new URL(url);
  const tempPath = path.join(uploadsDir, `media_${downloadId}.part`);
  let outputPath: string | null = null;

  try {
    const response = await downloadFile(url, tempPath);
    const stats = await fs.stat(tempPath);

    if (!stats.isFile() || stats.size === 0) {
      throw new Error('Downloaded media is empty');
    }
    if (stats.size !== response.bytesReceived) {
      throw new Error(
        `Downloaded media size mismatch (${stats.size} on disk, ${response.bytesReceived} received)`
      );
    }

    const prefix = await readFilePrefix(tempPath);
    const bodyError = detectErrorBody(prefix);
    if (bodyError) {
      throw new Error(bodyError);
    }

    const signatureExtension = detectExtension(prefix, response.contentType);
    if (
      response.contentType &&
      !isSupportedMediaContentType(response.contentType) &&
      !signatureExtension
    ) {
      throw new Error(`Unsupported response Content-Type (${response.contentType})`);
    }

    const extension =
      signatureExtension ||
      (response.contentType.startsWith('audio/') || response.contentType.startsWith('video/')
        ? detectExtension(Buffer.alloc(0), response.contentType)
        : null) ||
      '.media';

    outputPath = path.join(uploadsDir, `media_${downloadId}${extension}`);
    await fs.rename(tempPath, outputPath);

    const finalStats = await fs.stat(outputPath);
    console.log('[MediaDownloader] Download complete', {
      sourceType: 'direct-url',
      httpStatus: response.statusCode,
      extension,
      sizeBytes: finalStats.size,
      contentType: response.contentType || 'unspecified',
      signatureHex: prefix.subarray(0, 16).toString('hex'),
    });

    const basename = path.basename(parsedUrl.pathname);
    const title = path.parse(basename).name || `Media_${timestamp}`;

    return {
      audioPath: outputPath,
      title,
    };
  } catch (error) {
    for (const filePath of [tempPath, outputPath]) {
      if (!filePath) continue;
      try {
        await fs.rm(filePath, { force: true });
      } catch (cleanupError) {
        console.error(
          '[MediaDownloader] Temporary-file cleanup failed',
          sanitizeDiagnostic(
            cleanupError instanceof Error ? cleanupError.message : 'unknown cleanup error'
          )
        );
      }
    }

    const detail = sanitizeDiagnostic(
      error instanceof Error ? error.message : 'Unknown download error'
    );
    console.error('[MediaDownloader] Download failed', detail);
    throw new Error(`Failed to download media: ${detail}`);
  }
}

export function isValidMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
