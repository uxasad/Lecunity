import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExecSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(() => ''),
}));

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    default: {
      ...actual,
      execSync: mockExecSync,
    },
    execSync: mockExecSync,
  };
});

import { validateFFmpegInstallation } from '@/lib/ffmpeg';

describe('FFmpeg installation validation', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    mockExecSync.mockReturnValue('');
  });

  it('executes both configured binaries once and returns a combined result', () => {
    expect(validateFFmpegInstallation()).toEqual({
      isValid: true,
      details: 'FFmpeg and FFprobe are available and working',
    });
    expect(mockExecSync).toHaveBeenCalledTimes(2);
    expect(mockExecSync).toHaveBeenNthCalledWith(1, expect.any(String), {
      stdio: 'ignore',
      timeout: 5000,
    });
    expect(mockExecSync).toHaveBeenNthCalledWith(2, expect.any(String), {
      stdio: 'ignore',
      timeout: 5000,
    });
  });

  it('preserves timeout and process failure details without exposing command paths', () => {
    const processError = Object.assign(
      new Error('Command failed: C:\\private\\tools\\ffmpeg.exe -version'),
      {
        code: 'ETIMEDOUT',
        status: null,
        signal: 'SIGTERM',
        killed: true,
      }
    );
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockExecSync.mockImplementationOnce(() => {
      throw processError;
    });

    const result = validateFFmpegInstallation();
    const output = `${result.details}\n${logError.mock.calls.flat().join('\n')}`;

    expect(result.isValid).toBe(false);
    expect(result.details).toContain('code=ETIMEDOUT');
    expect(result.details).toContain('exitStatus=none');
    expect(result.details).toContain('signal=SIGTERM');
    expect(result.details).toContain('timedOut=true (5000ms)');
    expect(output).not.toContain('private');
    expect(mockExecSync).toHaveBeenCalledTimes(2);
    logError.mockRestore();
  });

  it('preserves a nonzero exit status without labeling it a timeout', () => {
    const processError = Object.assign(new Error('Command failed'), {
      code: 1,
      status: 1,
      signal: null,
      killed: false,
    });
    mockExecSync.mockImplementationOnce(() => {
      throw processError;
    });

    const result = validateFFmpegInstallation();

    expect(result.isValid).toBe(false);
    expect(result.details).toContain('code=1');
    expect(result.details).toContain('exitStatus=1');
    expect(result.details).toContain('signal=none');
    expect(result.details).not.toContain('timedOut');
  });
});
