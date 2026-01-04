# Contributing to pngcrypt

Thank you for your interest in contributing to pngcrypt!

## Prerequisites

- [Deno](https://deno.land/) v2.x or later

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```sh
   git clone https://github.com/YOUR_USERNAME/pngcrypt.git
   cd pngcrypt
   ```
3. Create a feature branch:
   ```sh
   git checkout -b feature/your-feature-name
   ```

## Development Commands

```sh
# Run encryption CLI
deno task pngencrypt

# Run decryption CLI
deno task pngdecrypt

# Lint code
deno lint

# Format code
deno fmt

# Check formatting
deno fmt --check

# Type check
deno check pngencrypt.ts pngdecrypt.ts

# Run E2E tests
deno task e2e

# Compile for all platforms
deno task compile
```

## Code Standards

- Run `deno fmt` before committing
- Ensure `deno lint` passes with no errors
- Ensure `deno check` passes with no type errors
- Follow existing code patterns and style
- Write clear, descriptive commit messages

## Testing

- Run `deno task e2e` to execute the end-to-end test suite
- Add tests for new features when applicable
- Ensure all tests pass before submitting a PR

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run all checks:
   ```sh
   deno fmt --check && deno lint && deno check pngencrypt.ts pngdecrypt.ts && deno task e2e
   ```
3. Push your branch and create a pull request
4. Fill out the PR template with a description of your changes
5. Wait for review and address any feedback

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, architecture, pngcrypt version)
- Any relevant error messages

### Feature Requests

When requesting features, please include:

- Description of the feature
- Use case / problem it solves
- Any implementation ideas you have

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
