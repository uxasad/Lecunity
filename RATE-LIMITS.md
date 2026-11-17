# Rate Limits and Resource Protection

## Overview

Lecunity uses server-side rate limiting and file validation to reduce excessive processing requests and protect application resources.

The current implementation uses an in-memory rate limiter. These limits are configuration values and should not be considered guaranteed Groq API quotas or permanent usage allowances.

## Enforced Rate Limits

### Hourly Transcription Limit

- Maximum: **5 transcription requests per client IP**
- Time window: 1 hour
- The window starts when the first request is recorded.
- Further requests are rejected after the limit is reached.

### Daily Transcription Limit

- Maximum: **20 transcription requests per client IP**
- Time window: 24 hours (rolling window).
- This is not a calendar-day or midnight reset.

Both limits are checked by the transcription action.

## File Validation Limits

| Validation | Configured limit | Implementation status |
|---|---:|---|
| General uploaded file | 50 MB code fallback; 100 MB in the example environment configuration | Enforced |
| Audio file | 25 MB | Enforced |
| Video-specific validation | 500 MB | Present, but blocked by the configured general upload limit |
| YouTube downloaded media | 100 MB | Configuration only; enforcement not verified |

The general upload limit can be changed using the `MAX_FILE_SIZE_MB` environment variable.

**Important:** The general upload-size check runs before the video-specific 500 MB check. Therefore, the effective video upload limit is the configured general limit (100 MB with the example configuration), not 500 MB.

Audio files larger than 25 MB are rejected by file validation. The validation error currently refers to OpenAI Whisper, so that message should be reviewed separately from the configured Groq transcription provider.

For downloaded media URLs and YouTube videos, the transcription action checks the downloaded audio size and attempts compression when it exceeds 24 MB. This is an audio compression step, not a maximum original-download-size enforcement mechanism.

## Client Identification

Rate limits use the client's IP address.

The application attempts to identify the client using:

1. `x-forwarded-for`
2. `x-real-ip`
3. `unknown` as a fallback

When a forwarded IP header contains multiple addresses, the first address is used.

Correct IP identification depends on the deployment proxy supplying trustworthy headers.

## Storage and Reset Behavior

The rate limiter stores request counts in a JavaScript `Map` in server memory.

Current behavior:

- No database is required.
- Expired entries are cleaned up every five minutes.
- Rate-limit records exist only for the lifetime of the server process.
- Restarting the server clears the stored limits.
- Separate server instances do not share their rate-limit records.

**Deployment limitation:** This implementation is suitable for basic single-instance protection. It does not provide globally consistent rate limiting across multiple server instances or serverless execution environments.

A shared storage solution, such as Redis, would be needed for reliable distributed rate limiting.

## API Endpoint

The application exposes:

```http
GET /api/limits
```

The endpoint reports the current hourly and daily usage information and configured file-size values.

The file-size values returned by this endpoint represent configuration. They do not prove that every limit is enforced by the corresponding processing path.

## Configuration

Rate-limit settings are centralized in:

```text
lib/rate-limiter.ts
```

Current configuration:

```typescript
TRANSCRIPTION: {
  MAX_REQUESTS: 5,
  WINDOW_MS: 60 * 60 * 1000,
},

FILE_SIZE: {
  MAX_SIZE_MB: 50,
  MAX_YOUTUBE_MB: 100,
},

CONCURRENT: {
  MAX_PROCESSING: 2,
},

DAILY: {
  MAX_TRANSCRIPTIONS: 20,
  WINDOW_MS: 24 * 60 * 60 * 1000,
},
```

Note that `CONCURRENT.MAX_PROCESSING` is currently only a configuration constant. No concurrent-processing enforcement was found in the inspected application code.

Similarly, `MAX_YOUTUBE_MB` is exposed through the limits API, but its enforcement has not been verified.

## Development and Maintenance

To change the configured hourly or daily limits, edit `lib/rate-limiter.ts`.

To change the general uploaded-file size limit, update `MAX_FILE_SIZE_MB` in the environment configuration.

After changing these values, run the project's tests and type checks.

Do not assume that increasing application limits also increases the quotas or rate limits of the external AI provider.

## Known Limitations and Future Improvements

The current implementation has the following limitations:

- In-memory records are lost when the server restarts.
- Multiple instances do not share usage records.
- IP-based limits can be affected by proxy configuration.
- Concurrent processing is not enforced.
- The configured YouTube download-size limit is not verified as enforced.
- File validation has a conflict between the general upload limit and video-specific limit.

Potential improvements:

- [ ] Introduce shared Redis-based rate-limit storage.
- [ ] Implement reliable distributed rate limiting.
- [ ] Enforce a maximum downloaded-media size.
- [ ] Implement actual concurrent-processing controls.
- [ ] Resolve the general and video-specific file-size limit conflict.
- [ ] Improve provider-specific error messages.
- [ ] Add automated tests for rate-limit enforcement.
