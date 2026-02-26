# Agent Guidelines for deno-api-server

This document provides guidelines for agentic coding in the deno-api-server repository.

## Build/Lint/Test Commands

### Running Tests
- Run all tests: `deno test --allow-all --no-check`
- Run tests in watch mode: `deno test --allow-all --no-check --watch`
- Run a single test file: `deno test --allow-all --no-check path/to/test.file.ts`

### Linting
- Run linter: `deno lint`
- Lint specific files: `deno lint path/to/file.ts`

### Formatting
- Format code: `deno fmt`
- Format specific files: `deno fmt path/to/file.ts`

### Type Checking
- Check types: `deno check mod.ts`

## Code Style Guidelines

### Imports
- Use named imports for better tree-shaking
- Group imports by source (standard library, third-party, local)
- Avoid wildcard imports (`import * as`) unless necessary
- Use absolute paths for local imports

### Formatting
- Use 2 spaces for indentation
- Maximum line width: 100 characters
- Use single quotes for strings
- Use semicolons at the end of statements
- Preserve prose wrapping in documentation

### Types
- Always use explicit types for function parameters and return values
- Avoid using `any` type (use `unknown` instead)
- Use type aliases for complex types
- Prefer interfaces for object shapes
- Use union types (`|`) for multiple possible types

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes, interfaces, and types
- Use UPPER_CASE for constants
- Use meaningful, descriptive names
- Avoid abbreviations unless widely understood

### Error Handling
- Use custom error classes for specific error types
- Always handle errors appropriately
- Provide meaningful error messages
- Use try-catch blocks for async operations
- Throw errors with appropriate HTTP status codes for API endpoints

### Testing
- Use Deno's built-in test runner
- Test files should have `.test.ts` suffix
- Use `Deno.test()` for test cases
- Use assert functions from `@std/assert`
- Mock external dependencies in tests
- Test both success and error cases

### Documentation
- Use JSDoc comments for public APIs
- Document function parameters and return values
- Include examples in documentation when helpful
- Keep documentation up-to-date with code changes

### Code Organization
- Follow the existing project structure
- Keep related files together
- Use feature-based organization
- Separate business logic from presentation
- Keep files focused on a single responsibility

### Best Practices
- Write small, focused functions
- Use pure functions when possible
- Avoid side effects
- Use functional programming patterns where appropriate
- Write reusable pipe functions
- Use dependency injection for services
- Share services between routes using DI
- Use state to pass data between pipes

### TypeScript Specific
- Enable strict TypeScript options (as configured in deno.json)
- Use `unknown` instead of `any`
- Use type guards for runtime type checking
- Use const assertions for literal types
- Use readonly properties when appropriate

### Deno Specific
- Use Deno standard library imports from `@std/`
- Use Deno permissions appropriately
- Handle Deno-specific errors
- Use Deno testing utilities

## Project Structure

- `src/` - Main source code
- `plugins/` - Plugin implementations
- `example/` - Example code and usage patterns
- `tests/` - Test files (though currently mixed with source)

## CI/CD

The project uses GitHub Actions for CI with the workflow defined in `.github/workflows/deno.yml`. Tests run on Ubuntu, Windows, and macOS.

## Version Control

- Follow semantic versioning
- Use conventional commit messages
- Keep commit messages concise and descriptive
- Reference issues when applicable

## Plugin Development

- Plugins should be self-contained in the `plugins/` directory
- Each plugin should have its own README
- Plugins should follow the same coding standards as the main project
- Plugin functions should accept the Api instance as first parameter

## Example Patterns

### Creating a Route
```typescript
const route = new Route(EMethod.GET, "/endpoint")
  .addPipe(context => {
    // Handle request
  });
```

### Error Handling
```typescript
try {
  // Operation that might fail
} catch (error) {
  if (error instanceof RequestError) {
    // Handle known error
  }
  throw error; // Re-throw unknown errors
}
```

### Testing Pattern
```typescript
Deno.test("Test description", async () => {
  // Arrange
  const route = new Route("GET", "/test");
  
  // Act
  const result = await route.execute(url, request, response);
  
  // Assert
  assertEquals(result.status, 200);
});
```

## Additional Resources

- Deno Documentation: https://deno.land/manual
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Project README: ./README.md
- Release Notes: ./RELEASE_NOTES.md

When the user requests anything to plan or implement something read and follow `docs/rules/planed.md`
