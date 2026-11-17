# Contributing to Lecunity

Thank you for your interest in contributing to Lecunity. This document explains how to set up the project and follow its development guidelines.

## Code of Conduct

Contributors are expected to maintain a respectful, inclusive, and professional environment.

## Getting Started

### 1. Fork and Clone

Fork the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/Lecunity.git
cd Lecunity
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create your local environment file:

```bash
cp .env.example .env.local
```

Add the required API keys and configuration values. Never commit `.env` or `.env.local` files.

### 4. Start the Development Server

```bash
pnpm dev
```

### 5. Create a Branch

Use a descriptive branch name:

```bash
git checkout -b feat/your-feature-name
```

## Development Guidelines

### Code Style

- Use TypeScript for application logic and React components.
- Follow the existing project structure and coding patterns.
- Use meaningful variable, function, and component names.
- Keep functions focused on a single responsibility.
- Add comments where the implementation needs clarification.
- Avoid unnecessary dependencies.

### File Organization

```text
actions/       Server Actions
app/           Next.js routes, layouts, and pages
components/    React UI components
lib/           Core application logic and integrations
types/         Shared TypeScript types
utils/         Reusable utility functions
```

### Naming Conventions

- **Files:** kebab-case (`validate-file.ts`)
- **React components:** PascalCase (`NotesDisplay`)
- **Functions and variables:** camelCase (`validateFile`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### TypeScript Guidelines

- Define appropriate types for function parameters and return values.
- Use interfaces or type aliases for structured data.
- Avoid `any` unless there is a clear technical reason.
- Reuse shared types from the `types/` directory when appropriate.
- Keep type definitions consistent with actual application behavior.

### React and Next.js Guidelines

- Use functional React components.
- Follow the Next.js App Router conventions.
- Use Server Actions for the existing server-side mutation workflows.
- Keep client-side and server-side responsibilities separate.
- Handle loading, validation, and error states properly.
- Use semantic HTML and accessible UI patterns.

## Security Requirements

All contributions must follow secure development practices:

- Validate user input on the server.
- Validate uploaded files, including file type and size.
- Never hardcode API keys or other secrets.
- Keep sensitive configuration in environment variables.
- Avoid exposing internal errors or sensitive information to users.
- Use safe file-handling and media-processing practices.
- Apply appropriate request rate limits.
- Review changes that affect file uploads, URL downloads, or external API calls.

## Testing Before Submitting

Run the relevant checks before opening a pull request.

### Type Checking

```bash
pnpm type-check
```

### Tests

```bash
pnpm test:run
```

### Linting

```bash
pnpm lint
```

### Production Build

```bash
pnpm build
```

Also manually test relevant changes, especially:

- Audio and video uploads
- Supported YouTube and direct media URLs
- Transcription and notes generation
- Supported output languages
- Validation and error handling
- Browser history behavior

Not every change requires testing every feature, but contributors should test the functionality affected by their changes.

## Bug Reports

Before reporting a bug:

1. Check whether the issue has already been reported.
2. Confirm that you are using the latest project version.
3. Provide clear reproduction steps.
4. Include relevant error messages without exposing API keys or private information.

### Bug Report Template

```markdown
**Describe the bug**

Explain what happened.

**Steps to reproduce**

1. Open the application.
2. Perform the relevant action.
3. Describe the observed result.

**Expected behavior**

Explain what should have happened.

**Environment**

- Operating System:
- Node.js version:
- Browser:

**Additional context**

Add relevant logs or screenshots.
```

## Feature Requests

Feature requests should explain the problem and the proposed improvement.

### Feature Request Template

```markdown
**Problem**

What problem are you trying to solve?

**Proposed solution**

Describe the suggested feature.

**Alternatives**

Mention other solutions considered.

**Additional context**

Include examples or screenshots if relevant.
```

## Architecture Changes

For significant technical changes:

1. Explain the problem the change addresses.
2. Describe the proposed implementation.
3. Consider compatibility with existing functionality.
4. Update `ARCHITECTURE.md` when the system design changes.
5. Update relevant documentation and tests.

## Documentation

Keep project documentation accurate and consistent with the current implementation.

Relevant documentation includes:

- `README.md` — Project overview and features
- `ARCHITECTURE.md` — Technical architecture
- `PROJECT-STRUCTURE.md` — Repository organization
- `QUICKSTART.md` — Quick setup instructions
- `SETUP.md` — Environment and installation setup
- `TESTING.md` — Testing instructions

## Pull Requests

Before submitting a pull request:

1. Make sure your branch contains only relevant changes.
2. Run the appropriate checks and tests.
3. Update documentation when necessary.
4. Provide a clear description of the changes.
5. Mention any known limitations.

Thank you for helping improve Lecunity.
