# File Upload Security

This document describes the file validation and security checks implemented in Lecunity.

## Overview

Lecunity uses multiple validation checks to reduce the risk of invalid, mismatched, or suspicious media uploads.

The implementation includes:

- MIME type and file extension validation
- File size restrictions
- File signature (magic byte) validation
- File integrity checks
- Basic suspicious-content pattern scanning
- Generated filenames for stored uploads
- Cleanup of files that fail security validation

**Important:** These checks provide basic upload protection. They are not a replacement for antivirus software or a comprehensive malware scanner.

## 1. MIME Type and Extension Validation

**Location:** `utils/validateFile.ts`

The `validateFile()` function checks whether the uploaded file has:

- An allowed audio or video extension
- An allowed MIME type
- A file size within the configured limit

Supported formats include common audio and video types such as MP3, WAV, M4A, AAC, OGG, FLAC, MP4, MKV, MOV, AVI, and WebM.

MIME types and extensions alone are not reliable proof of file content because they can be manipulated.

## 2. File Size Restrictions

**Location:** `utils/validateFile.ts`

The general maximum file size is controlled by `MAX_FILE_SIZE_MB`.

- Default in the validation utility: 50 MB, based on the rate limiter configuration.
- Example environment configuration: 100 MB.
- Audio files also have an additional 25 MB validation limit.
- Video files have an additional 500 MB validation limit.

The effective limit depends on the configured general file-size limit and the additional format-specific checks.

## 3. File Signature Validation

**Location:** `lib/file-security.ts`

The `validateFileSignature()` function reads the first 12 bytes of a file and compares them against known signatures.

This helps identify whether the actual file content matches a supported media format.

The implementation includes signatures for selected MP3, WAV, FLAC, OGG, M4A, MP4, MKV, MOV, and AVI formats.

The signature list is limited and does not cover every possible variation of these formats.

## 4. File Integrity Validation

**Location:** `lib/file-security.ts`

The `validateFileIntegrity()` function compares:

- The detected file extension
- The detected MIME type
- The extension and MIME type claimed by the upload

If the detected content does not match the claimed file type, validation fails.

This helps detect file-type mismatches and some forms of extension or MIME-type manipulation.

## 5. Basic Suspicious-Content Scanning

**Location:** `lib/file-security.ts`

The `scanFileContent()` function performs a limited scan of the beginning of the file.

It checks for:

- Suspiciously small files
- Selected executable signatures and patterns
- Shell script indicators
- HTML or JavaScript script tags
- Selected command and scripting patterns

The scan examines only the first 1 KB of file content. It does not inspect the entire file and cannot reliably detect all malicious content.

## 6. Upload Security Workflow

**Locations:** `lib/upload.ts`, `lib/file-security.ts`

The implementation has two upload paths:

### `parseFormData()`

This path:

1. Parses multipart form data using Formidable.
2. Stores uploaded files in the uploads directory.
3. Checks MIME type, extension, and file size using `validateFile()`.
4. Removes a file when this validation fails.
5. Returns the validated upload information.

This path does not currently call `validateFileSecurely()`.

### `saveUploadedFile()`

This path:

1. Reads the uploaded file into a buffer.
2. Generates a unique filename.
3. Saves the file in the uploads directory.
4. Runs `validateFileSecurely()`.
5. Deletes the file if security validation fails.
6. Logs security warnings when present.
7. Returns the uploaded file information if validation succeeds.

The comprehensive validation function combines signature validation, integrity checks, and suspicious-content scanning.

## 7. Filename Handling and Cleanup

**Location:** `lib/upload.ts`

Uploaded files are stored using generated filenames rather than their original filenames.

When security validation fails in `saveUploadedFile()`, the uploaded file is deleted through `cleanupUploadedFile()`.

The original filename is retained as metadata for application use.

## 8. Current Limitations

The current implementation has the following limitations:

- Signature validation supports only a selected list of media signatures.
- The suspicious-content scanner checks only the first 1 KB.
- Pattern-based scanning is not equivalent to antivirus or malware detection.
- Some media formats and signature variations may not be recognized.
- `parseFormData()` does not currently run the comprehensive security validation function.
- The implementation does not provide a guarantee that every malicious file will be detected.

## 9. Relevant Source Files

| File | Responsibility |
|---|---|
| `utils/validateFile.ts` | MIME type, extension, and file-size validation |
| `lib/file-security.ts` | Signature validation, integrity checks, and basic content scanning |
| `lib/upload.ts` | Upload parsing, file storage, security validation, and cleanup |
