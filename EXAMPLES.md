# Examples Guide

This guide provides an overview of all the examples available in the deno-api-server repository.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Authentication](#authentication)
- [Validation](#validation)
- [Testing](#testing)
- [Running Examples](#running-examples)
- [Creating Your Own Examples](#creating-your-own-examples)

## Basic Examples

### Main Example

**File**: [`example/main.ts`](example/main.ts)

This is the most comprehensive example showing:
- Basic route setup
- Multiple HTTP methods
- URL parameter matching
- JSON body processing
- State management between pipes
- Error handling
- File serving
- Redirects
- Event system usage

**Key Features Demonstrated:**
- `Api` class usage
- `Route` creation with different matchers
- Built-in pipes (jsonBodyPipe, redirectPipe, filePipe, htmlPipe)
- Event listeners for route registration and response logging
- Dependency injection
- Asynchronous pipe operations

### Quick Start

```bash
# Run the main example
deno run --allow-net --allow-read --allow-env example/main.ts

# Test some endpoints
curl http://localhost:8080/
curl http://localhost:8080/mixed-hello
curl -X POST http://localhost:8080/body/json -H "Content-Type: application/json" -d '{"test":"data"}'
```

## Authentication

### JWT Authentication

**File**: [`example/authentification-jwt.ts`](example/authentification-jwt.ts)

Demonstrates JWT (JSON Web Token) authentication using the [djwt](https://deno.land/x/djwt) library.

**Key Concepts:**
- Token generation and verification
- Protected routes with authentication
- Role-based access control
- Custom authentication pipes
- Error handling for unauthorized access

**Example Usage:**

```bash
# Start the auth example
deno run --allow-net --allow-env example/authentification-jwt.ts

# Get a token
curl http://localhost:8080/auth

# Access protected endpoint with token
curl http://localhost:8080/safe -H "token: YOUR_TOKEN_HERE"
```

**Code Highlights:**

```typescript
// Custom authentication pipe
async function verifyPipe({ request, state }: IContext) {
  if (request.headers.has('token')) {
    try {
      const jwt = request.headers.get('token');
      if (typeof jwt === 'string') {
        const payload = await verify(jwt, key);
        state.set('auth', payload);
      }
    } catch (e) {
      throw new AccessDeniedError(e.message, 403, e);
    }
  }
}

// Role-based access control
function hasRightPipe(name: string) {
  return ({ state }: IContext) => {
    if (state.has('auth')) {
      const auth = state.get('auth');
      if (auth && Array.isArray(auth.rights)) {
        if (auth.rights.includes(name)) {
          return; // continue
        }
      }
    }
    throw new AccessDeniedError();
  };
}
```

## Validation

### Body Validation

**File**: [`example/body-validation.ts`](example/body-validation.ts)

Shows how to validate JSON request bodies using the [validasaur](https://deno.land/x/validasaur) library.

**Key Concepts:**
- Request body validation
- Schema-based validation
- Custom validation pipes
- Error handling for invalid input
- Integration with jsonBodyPipe

**Example Usage:**

```bash
# Start the validation example
deno run --allow-net --allow-env example/body-validation.ts

# Send valid data
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John","age":30}'

# Send invalid data (missing required field)
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'
```

**Code Highlights:**

```typescript
// Validation schema
const schema: ValidationRules = {
  name: required,
  age: [required, isNumber],
};

// Custom validation pipe factory
function bodyValidationPipe(schema: ValidationRules) {
  return async ({ state, response }: IContext) => {
    const body = state.get('body'); // Set by jsonBodyPipe
    
    const [passes, errors] = await validate(body, schema);
    
    if (!passes) {
      response.body = {
        validation: await flattenMessages(errors),
      };
      throw new BadRequestError('Invalid model', 400);
    }
  };
}

// Usage in route
new Route(EMethod.POST, '/')
  .addPipe(jsonBodyPipe) // Parse JSON first
  .addPipe(bodyValidationPipe(schema)) // Then validate
  .addPipe(handleValidDataPipe); // Finally process valid data
```

## Testing

### Unit Testing

**File**: [`example/unit-testing.test.ts`](example/unit-testing.test.ts)

Comprehensive guide to testing deno-api-server applications with built-in mocking utilities.

**Key Concepts:**
- Mock API creation
- Mock requests and responses
- Mock dependency injection
- Mock function utilities
- Route testing patterns
- Error case testing

**Test Examples:**

```typescript
// Basic route test
Deno.test('Route returns 200', async () => {
  const route = new Route('GET', '/hello')
    .addPipe(({ response }) => {
      response.body = { message: 'Hello' };
    });
  
  const api = mockApi(route);
  await api.sendByArguments('GET', '/hello');
  
  assertEquals(api.lastContext?.response.status, 200);
  assertEquals(api.lastContext?.response.body, { message: 'Hello' });
});

// Testing with mock injections
Deno.test('Route with mocked services', async () => {
  const route = new Route('POST', '/users')
    .injections({
      userService: {
        create: (user) => Promise.resolve({ id: 1, ...user })
      }
    })
    .addPipe(async ({ di, response, state }) => {
      const user = state.get('body');
      response.body = await di.userService.create(user);
    });
  
  const api = mockApi(route);
  
  // Override injections for testing
  api.mockInjections({
    userService: {
      create: (user) => Promise.resolve({ id: 999, ...user })
    }
  });
  
  const request = mockRequest('POST', '/users', { name: 'Test' });
  await api.sendByRequest(request);
  
  assertEquals(api.lastContext?.response.body, { id: 999, name: 'Test' });
});

// Testing error cases
Deno.test('Route throws error', async () => {
  const route = new Route('GET', '/error')
    .addPipe(() => {
      throw new RequestError('Test error', 400);
    });
  
  const api = mockApi(route);
  await api.sendByArguments('GET', '/error');
  
  assertEquals(api.lastContext?.response.status, 400);
});
```

**Mock Utilities:**

- `mockApi(route)` - Creates a mock API instance
- `mockRequest(method, url, body?)` - Creates mock request
- `mockResponse()` - Creates mock response  
- `mockContext(settings)` - Creates mock context
- `mockFn(implementation?)` - Creates mock function with call tracking

## Running Examples

### Prerequisites

All examples require:
- Deno 1.25.0 or higher
- Network permissions (`--allow-net`)
- Environment access (`--allow-env`)
- Some examples need additional permissions

### Common Commands

```bash
# Run an example
deno run --allow-net --allow-env example/FILE_NAME.ts

# Run with additional permissions if needed
deno run --allow-net --allow-env --allow-read example/FILE_NAME.ts

# Run tests
deno test --allow-all --no-check example/unit-testing.test.ts
```

### Example-Specific Requirements

| Example File | Additional Permissions | Dependencies |
|--------------|------------------------|--------------|
| `main.ts` | `--allow-read` | None |
| `authentification-jwt.ts` | None | djwt |
| `body-validation.ts` | None | validasaur |
| `unit-testing.test.ts` | None | None |

## Creating Your Own Examples

### Example Structure

A good example should:

1. **Focus on one concept**: Authentication, validation, testing, etc.
2. **Be self-contained**: Include all necessary imports
3. **Have clear comments**: Explain what each part does
4. **Show usage**: Include curl commands or instructions
5. **Handle errors**: Show proper error handling
6. **Be testable**: Include test cases if applicable

### Example Template

```typescript
/**
 * example to demonstrate [CONCEPT]
 * @description Brief description of what this example shows
 * @see https://link.to.relevant.docs
 */

import { Api, EMethod, Route } from '../mod.ts';
// Import other necessary modules

// Create API instance
const api = new Api({ port: 8080 });

// Add example routes
api.addRoute(
  new Route(EMethod.GET, '/example')
    .addPipe(({ response }) => {
      response.body = { message: 'Example response' };
    })
);

// Start server
console.log(`Start server localhost:${api.serverConfig.port}`);
await api.listen();

/**
 * Example Usage:
 *
 * curl http://localhost:8080/example
 *
 * Expected response:
 * {"message":"Example response"}
 */
```

### Best Practices for Examples

1. **Use realistic data**: Avoid `foo`, `bar` - use meaningful names
2. **Show both success and error cases**: Demonstrate robust handling
3. **Include configuration**: Show how to configure the example
4. **Document limitations**: Mention what the example doesn't cover
5. **Keep it simple**: Focus on the main concept, avoid distractions
6. **Use modern practices**: Follow current TypeScript/Deno best practices

## Example Patterns

### Common Patterns Demonstrated

1. **Route Organization**: Different ways to structure routes
2. **Pipe Composition**: Chaining pipes for complex processing
3. **Error Handling**: Various error handling strategies
4. **State Management**: Passing data between pipes
5. **Dependency Injection**: Sharing services between routes
6. **Configuration**: Server and route configuration
7. **Testing**: Different testing approaches

### Pattern: Route Factory

```typescript
// Create reusable route factory
function createCRUDRoutes(entity: string, service: any) {
  return [
    new Route(EMethod.GET, `/${entity}`)
      .addPipe(async ({ response, di }) => {
        response.body = await service.getAll();
      }),
    
    new Route(EMethod.POST, `/${entity}`)
      .addPipe(jsonBodyPipe)
      .addPipe(async ({ response, state, di }) => {
        response.body = await service.create(state.get("body"));
      }),
    
    new Route(EMethod.GET, `/${entity}/:id`)
      .addPipe(async ({ response, match, di }) => {
        response.body = await service.getById(match.params.id);
      })
  ];
}

// Usage
const userRoutes = createCRUDRoutes("users", userService);
userRoutes.forEach(route => api.addRoute(route));
```

### Pattern: Conditional Middleware

```typescript
function conditionalPipe(condition: boolean, pipe: IPipe): IPipe {
  return (context: IContext) => {
    if (condition) {
      return pipe(context);
    }
    // Skip this pipe
  };
}

// Usage
new Route(EMethod.GET, "/data")
  .addPipe(conditionalPipe(isProduction, loggingPipe))
  .addPipe(dataProcessingPipe);
```

## Troubleshooting Examples

### Common Issues

**Permission Errors:**
```bash
# Add required permissions
deno run --allow-net --allow-env --allow-read example/main.ts
```

**Missing Dependencies:**
```bash
# Check imports in the example file
# Install missing dependencies if needed
```

**Port Conflicts:**
```bash
# Change the port in the example
const api = new Api({ port: 3000 }); // Use different port
```

### Debugging Tips

1. **Check Deno version**: `deno --version`
2. **Run with debug flags**: `deno run --log-level=debug example.ts`
3. **Test individual components**: Isolate parts of the example
4. **Check network**: Ensure port is available
5. **Review imports**: Verify all imports are correct

## Contributing Examples

We welcome contributions of new examples! Here's how to contribute:

1. **Fork the repository**
2. **Create your example** in the `example/` directory
3. **Follow the template** and best practices
4. **Test your example** thoroughly
5. **Add to this guide** - update EXAMPLES.md
6. **Submit a pull request**

### Example Contribution Checklist

- [ ] Example focuses on one clear concept
- [ ] Includes proper documentation and comments
- [ ] Has usage instructions
- [ ] Handles errors appropriately
- [ ] Follows coding standards
- [ ] All tests pass
- [ ] No linting errors
- [ ] Updated EXAMPLES.md

## Additional Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](TESTING.md)
- [Plugins Guide](PLUGINS.md)
- [Best Practices](BEST_PRACTICES.md)
- [Deno Manual](https://deno.land/manual)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

## Example Index

Here's a quick reference to all available examples:

### Core Examples
- [`main.ts`](example/main.ts) - Comprehensive example with multiple features
- [`unit-testing.test.ts`](example/unit-testing.test.ts) - Testing patterns and utilities

### Feature Examples
- [`authentification-jwt.ts`](example/authentification-jwt.ts) - JWT authentication
- [`body-validation.ts`](example/body-validation.ts) - Request body validation

### Utility Examples
- [`static-file.ts`](example/static-file.ts) - Static file serving (if available)

### Third-Party Integrations
- JWT authentication with [djwt](https://deno.land/x/djwt)
- Validation with [validasaur](https://deno.land/x/validasaur)

## Roadmap for Examples

Future examples we'd like to add:

- **Database integration** - MongoDB, PostgreSQL examples
- **WebSocket support** - Real-time communication
- **GraphQL integration** - GraphQL API example
- **File uploads** - Handling file uploads
- **Rate limiting** - Request rate limiting
- **CORS handling** - Cross-origin resource sharing
- **SSO integration** - Single sign-on examples
- **Microservices** - Service-to-service communication

If you'd like to contribute any of these examples, please let us know!