# Testing Guide

This document explains the testing tools, configuration, available test suites, and commands used to test Lecunity.

## 1. Testing Tools

Lecunity uses two testing frameworks:

| Tool                  | Purpose                      |
| --------------------- | ---------------------------- |
| Vitest                | Unit and integration testing |
| React Testing Library | Testing React components     |
| Jest DOM              | DOM assertions               |
| Playwright            | End-to-end browser testing   |
| V8 Coverage           | Measuring code coverage      |

## 2. Vitest Configuration

**Configuration file:** `vitest.config.mts`

Vitest is configured with:

- `jsdom` as the test environment.
- Global test APIs.
- React support through `@vitejs/plugin-react`.
- `tests/setup.ts` as the setup file.
- V8 as the coverage provider.
- Text, JSON, and HTML coverage reports.

The configuration includes test files matching:

`**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`

It excludes `node_modules`, `dist`, `.next`, `build`, and E2E test directories.

### Test Setup

**File:** `tests/setup.ts`

The setup file:

- Imports Jest DOM matchers.
- Cleans up rendered React components after each test.
- Mocks Next.js navigation functions.
- Sets test environment variables for the AI provider, API key, and upload size.

These settings provide a consistent environment for unit and integration tests.

## 3. Available Unit and Integration Tests

Tests are located in `tests/integration/`.

| Test file                 | Main testing area                       |
| ------------------------- | --------------------------------------- |
| `api-limits.test.ts`      | API limits                              |
| `file-security.test.ts`   | File signatures and security validation |
| `file-validation.test.ts` | File type and size validation           |
| `history.test.ts`         | Browser history functionality           |
| `media-player.test.tsx`   | Media player component                  |
| `quiz.test.tsx`           | Quiz-related logic                      |
| `rate-limiter.test.ts`    | Rate-limiting behavior                  |

The presence of a quiz test file does not necessarily mean a complete quiz feature is available in the application.

## 4. End-to-End Testing

**Configuration file:** `playwright.config.ts`

Playwright tests are located in `tests/e2e/`.

| Test file               | Main testing area        |
| ----------------------- | ------------------------ |
| `homepage.spec.ts`      | Homepage behavior        |
| `file-upload.spec.ts`   | File upload interactions |
| `history.spec.ts`       | History interactions     |
| `rate-limiting.spec.ts` | Rate-limiting behavior   |

### Browser Projects

The configuration includes five browser/device projects:

- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### E2E Server Configuration

Playwright uses:

`http://localhost:3000`

It starts the application with `pnpm dev` before running tests.

Additional configuration:

- Tests run in parallel.
- CI mode enables two retries.
- CI mode uses one worker.
- HTML reporting is enabled.
- Traces are collected on the first retry.
- Screenshots are captured on test failure.

## 5. Running Tests

Run these commands from the project root.

### Vitest

Run tests in watch mode:

```bash
pnpm test
```

Run all unit and integration tests once:

```bash
pnpm test:run
```

Open the interactive Vitest UI:

```bash
pnpm test:ui
```

Generate a coverage report:

```bash
pnpm test:coverage
```

### Playwright

Run all end-to-end tests:

```bash
pnpm test:e2e
```

Open Playwright UI:

```bash
pnpm test:e2e:ui
```

Run tests with visible browser windows:

```bash
pnpm test:e2e:headed
```

Run only Chromium tests:

```bash
pnpm test:e2e:chromium
```

Open Playwright debugging mode:

```bash
pnpm test:e2e:debug
```

## 6. Browser Installation

If Playwright browsers are not installed, install them with:

```bash
pnpm exec playwright install
```

To install only Chromium:

```bash
pnpm exec playwright install chromium
```

## 7. Recommended Testing Workflow

Before committing code changes, use this workflow:

1. Run unit and integration tests:

   ```bash
   pnpm test:run
   ```

2. Check TypeScript:

   ```bash
   pnpm type-check
   ```

3. Run the end-to-end suite when application behavior has changed:

   ```bash
   pnpm test:e2e
   ```

4. Check code formatting:

   ```bash
   pnpm format:check
   ```

5. Run the production build check:

   ```bash
   pnpm build
   ```

A successful test run does not automatically guarantee that the production build or deployment will succeed.

## 8. Current Testing Limitations

- Test coverage depends on the test cases currently implemented.
- Passing unit and integration tests do not guarantee that every real-world media upload will work.
- Browser tests depend on the local application and installed Playwright browsers.
- External AI services and API behavior may require separate integration verification.
- CI and deployment environments may behave differently from local development.

## 9. Test Directory Structure

```text
tests/
├── setup.ts
├── fixtures/
│   └── test.txt
├── integration/
│   ├── api-limits.test.ts
│   ├── file-security.test.ts
│   ├── file-validation.test.ts
│   ├── history.test.ts
│   ├── media-player.test.tsx
│   ├── quiz.test.tsx
│   └── rate-limiter.test.ts
└── e2e/
    ├── file-upload.spec.ts
    ├── history.spec.ts
    ├── homepage.spec.ts
    └── rate-limiting.spec.ts
```

## 10. Related Configuration

- `vitest.config.mts`
- `playwright.config.ts`
- `package.json`
- `tests/setup.ts`
- `tests/fixtures/`
