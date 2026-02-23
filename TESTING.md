# Testing Guide

This guide covers testing strategies and utilities for deno-api-server applications.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Built-in Testing Utilities](#built-in-testing-utilities)
- [Mocking API](#mocking-api)
- [Testing Patterns](#testing-patterns)
- [Test Organization](#test-organization)
- [Testing Best Practices](#testing-best-practices)
- [Example Tests](#example-tests)

## Testing Philosophy

deno-api-server is designed with testability in mind:

1. **Functional Pipes**: Small, focused functions are easy to test
2. **Dependency Injection**: Makes it easy to mock dependencies
3. **Built-in Mocks**: Comprehensive mocking utilities included
4. **Isolated Components**: Routes, pipes, and services can be tested independently

## Built-in Testing Utilities

The framework includes powerful mocking utilities in `dev_mod.ts`:

### Mock Functions

```typescript
import { mockFn } from '../dev_mod.ts';

// Create a mock function
const mockFunction = mockFn((name: string) => `Hello, ${name}!`);

// Call the function
const result = mockFunction('World'); // Returns "Hello, World!"

// Inspect calls
console.log(mockFunction.mock.calls.length); // 1
console.log(mockFunction.mock.calls[0]); // ["World"]
console.log(mockFunction.mock.returns[0]); // "Hello, World!"

// Change implementation
mockFunction.mock.implement((name: string) => `Hi, ${name}!`);

// Clear call history
mockFunction.mock.clear();
```

### Mock API

```typescript
import { mockApi } from '../dev_mod.ts';

const route = new Route(EMethod.GET, '/test')
  .addPipe(({ response }) => {
    response.body = { message: 'Hello' };
  });

const api = mockApi(route);

// Test the route
await api.sendByArguments('GET', '/test');

// Inspect results
console.log(api.lastRoute); // The route that was matched
console.log(api.lastContext?.response.status); // 200
console.log(api.lastContext?.response.body); // { message: 'Hello' }
```

### Mock Request/Response

```typescript
import { mockRequest, mockResponse, mockContext } from '../dev_mod.ts';

// Create mock request
const request = mockRequest('POST', '/users', { name: 'John' });

// Create mock response  
const response = mockResponse();

// Create mock context
const context = mockContext({
  request,
  response,
  state: new Map([['userId', 123]])
});

// Test a pipe directly
await myPipe(context);

// Inspect results
console.log(response.status); // Check status code
console.log(response.body); // Check response body
```

### Mock Injections

```typescript
const route = new Route(EMethod.GET, '/users')
  .injections({
    userService: {
      getUsers: () => [{ id: 1, name: 'Real User' }]
    }
  })
  .addPipe(async ({ response, di }) => {
    response.body = await di.userService.getUsers();
  });

const api = mockApi(route);

// Override injections for testing
api.mockInjections({
  userService: {
    getUsers: () => [{ id: 999, name: 'Mock User' }]
  }
});

await api.sendByArguments('GET', '/users');

console.log(api.lastContext?.response.body);
// Output: [{ id: 999, name: 'Mock User' }]
```

## Testing Patterns

### Unit Testing Pipes

```typescript
import { assertEquals } from '../src/dev_deps.ts';
import { mockContext } from '../dev_mod.ts';

Deno.test('myPipe sets response body', async () => {
  // Create a simple pipe
  function myPipe(context: IContext) {
    context.response.body = { processed: true };
  }

  // Create mock context
  const context = mockContext({});
  
  // Execute pipe
  await myPipe(context);
  
  // Assert results
  assertEquals(context.response.body, { processed: true });
});
```

### Integration Testing Routes

```typescript
Deno.test('GET /users returns user list', async () => {
  const userData = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  
  const route = new Route(EMethod.GET, '/users')
    .addPipe(({ response }) => {
      response.body = userData;
    });
  
  const api = mockApi(route);
  await api.sendByArguments('GET', '/users');
  
  assertEquals(api.lastContext?.response.status, 200);
  assertEquals(api.lastContext?.response.body, userData);
});
```

### Testing Error Cases

```typescript
Deno.test('POST /users with invalid data throws error', async () => {
  const route = new Route(EMethod.POST, '/users')
    .addPipe(jsonBodyPipe)
    .addPipe(({ state }) => {
      const data = state.get('body');
      if (!data.name) {
        throw new BadRequestError('Name is required');
      }
    });
  
  const api = mockApi(route);
  
  // Test with invalid data
  const request = mockRequest('POST', '/users', {});
  await api.sendByRequest(request);
  
  assertEquals(api.lastContext?.response.status, 400);
});
```

### Testing with Mock Functions

```typescript
Deno.test('userService.create is called with correct data', async () => {
  const mockCreate = mockFn((userData) => Promise.resolve({ id: 1, ...userData }));
  
  const route = new Route(EMethod.POST, '/users')
    .injections({
      userService: {
        create: mockCreate
      }
    })
    .addPipe(jsonBodyPipe)
    .addPipe(async ({ state, di, response }) => {
      const userData = state.get('body');
      response.body = await di.userService.create(userData);
    });
  
  const api = mockApi(route);
  const request = mockRequest('POST', '/users', { name: 'Test User' });
  await api.sendByRequest(request);
  
  // Verify the mock was called correctly
  assertEquals(mockCreate.mock.calls.length, 1);
  assertEquals(mockCreate.mock.calls[0], [{ name: 'Test User' }]);
  assertEquals(api.lastContext?.response.body, { id: 1, name: 'Test User' });
});
```

## Test Organization

### Recommended Test Structure

```
my-api-project/
├── src/
│   ├── routes/
│   │   ├── user.routes.ts
│   │   └── product.routes.ts
│   ├── pipes/
│   │   ├── auth.pipe.ts
│   │   └── validation.pipe.ts
│   └── services/
│       ├── user.service.ts
│       └── product.service.ts
└── tests/
    ├── routes/
    │   ├── user.routes.test.ts
    │   └── product.routes.test.ts
    ├── pipes/
    │   ├── auth.pipe.test.ts
    │   └── validation.pipe.test.ts
    ├── services/
    │   ├── user.service.test.ts
    │   └── product.service.test.ts
    └── integration/
        ├── api.integration.test.ts
        └── full-flow.test.ts
```

### Test File Naming

- **Unit tests**: `*.test.ts` (e.g., `user.service.test.ts`)
- **Integration tests**: `*.integration.test.ts`
- **End-to-end tests**: `*.e2e.test.ts`

### Test Structure

```typescript
// Import dependencies
import { assertEquals, assertThrows } from '../src/dev_deps.ts';
import { mockApi, mockRequest } from '../dev_mod.ts';

// Test suite for a specific component
Deno.test('UserService', async (t) => {
  // Individual test cases
  await t.step('getUser returns user by ID', async () => {
    // Arrange
    const service = new UserService();
    
    // Act
    const result = await service.getUser(1);
    
    // Assert
    assertEquals(result.id, 1);
  });
  
  await t.step('getUser throws error for invalid ID', async () => {
    // Arrange
    const service = new UserService();
    
    // Act & Assert
    await assertThrows(
      async () => await service.getUser(-1),
      Error,
      'Invalid user ID'
    );
  });
});
```

## Testing Best Practices

### General Principles

1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **Keep tests isolated**: Tests shouldn't depend on each other
3. **Make tests deterministic**: Same input should always produce same output
4. **Test both happy and error paths**: Cover success and failure cases
5. **Keep tests fast**: Slow tests discourage running them

### Specific Recommendations

#### Testing Routes

```typescript
// Good: Test the route's behavior
Deno.test('GET /users returns user list', async () => {
  const route = createUserListRoute();
  const api = mockApi(route);
  
  await api.sendByArguments('GET', '/users');
  
  assertEquals(api.lastContext?.response.status, 200);
  assertArrayIsArray(api.lastContext?.response.body);
});

// Avoid: Testing internal pipe implementation
Deno.test('user list pipe calls service', async () => {
  // This is too tied to implementation details
});
```

#### Testing Pipes

```typescript
// Good: Test pipe behavior with different inputs
Deno.test('authPipe allows valid tokens', async () => {
  const pipe = createAuthPipe('valid-token');
  const context = mockContext({
    request: mockRequest('GET', '/protected', null, {
      'Authorization': 'Bearer valid-token'
    })
  });
  
  await pipe(context);
  // Should not throw
});

Deno.test('authPipe rejects invalid tokens', async () => {
  const pipe = createAuthPipe('valid-token');
  const context = mockContext({
    request: mockRequest('GET', '/protected', null, {
      'Authorization': 'Bearer invalid-token'
    })
  });
  
  await assertThrows(
    () => pipe(context),
    AccessDeniedError
  );
});
```

#### Testing Services

```typescript
// Good: Test service methods with different scenarios
Deno.test('UserService.create validates input', async () => {
  const service = new UserService();
  
  // Valid input
  const validUser = await service.create({ name: 'Valid', email: 'valid@example.com' });
  assertEquals(validUser.name, 'Valid');
  
  // Invalid input
  await assertThrows(
    () => service.create({ name: '', email: 'invalid' }),
    ValidationError
  );
});
```

### Mocking Strategies

#### When to Mock

- **Mock external services**: Database, API calls, etc.
- **Mock time-dependent functions**: Date, random values
- **Mock complex dependencies**: Avoid slow or unreliable dependencies
- **Don't mock**: Simple pure functions, core business logic

#### Mocking Levels

```typescript
// Level 1: No mocking (for pure functions)
Deno.test('calculateTotal sums correctly', () => {
  assertEquals(calculateTotal([1, 2, 3]), 6);
});

// Level 2: Mock dependencies
Deno.test('UserService.getUser calls database', async () => {
  const mockDb = {
    getUser: mockFn((id) => Promise.resolve({ id, name: 'Mock User' }))
  };
  
  const service = new UserService(mockDb);
  const user = await service.getUser(1);
  
  assertEquals(mockDb.getUser.mock.calls, [[1]]);
  assertEquals(user.name, 'Mock User');
});

// Level 3: Full integration (no mocking)
Deno.test('User API integration', async () => {
  const api = createUserApi();
  const testUser = { name: 'Integration Test', email: 'test@example.com' };
  
  // This would call the real database
  const response = await api.sendByArguments('POST', '/users', testUser);
  
  assertEquals(response.status, 201);
  // Clean up
  await api.sendByArguments('DELETE', `/users/${response.body.id}`);
});
```

### Test Data Management

#### Test Data Factories

```typescript
function createTestUser(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides
  };
}

Deno.test('UserService.updateUser', async () => {
  const testUser = createTestUser();
  const updates = { name: 'Updated Name' };
  
  const service = new UserService();
  const updated = await service.updateUser(testUser.id, updates);
  
  assertEquals(updated.name, 'Updated Name');
  assertEquals(updated.id, testUser.id);
});
```

#### Test Database Setup

```typescript
async function setupTestDatabase() {
  const db = new Database();
  await db.connect();
  
  // Create test data
  await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [
    ['Test User 1', 'test1@example.com'],
    ['Test User 2', 'test2@example.com']
  ]);
  
  return db;
}

async function cleanupTestDatabase(db: Database) {
  await db.query('DELETE FROM users WHERE email LIKE ?', ['%@example.com']);
  await db.disconnect();
}

Deno.test('UserRepository.findByEmail', async () => {
  const db = await setupTestDatabase();
  const repo = new UserRepository(db);
  
  try {
    const user = await repo.findByEmail('test1@example.com');
    assertEquals(user.name, 'Test User 1');
  } finally {
    await cleanupTestDatabase(db);
  }
});
```

## Example Tests

### Complete Route Test Example

```typescript
import { 
  assertEquals, 
  assertThrows, 
  assertArrayIsArray 
} from '../src/dev_deps.ts';
import { 
  mockApi, 
  mockRequest, 
  mockResponse 
} from '../dev_mod.ts';
import { 
  EMethod, 
  Route, 
  RequestError, 
  BadRequestError 
} from '../mod.ts';
import jsonBodyPipe from '../src/presets/pipes/body/json-body.pipe.ts';

// Test suite for user routes
Deno.test('User Routes', async (t) => {
  // Setup - create test routes
  function createUserRoutes() {
    return [
      new Route(EMethod.GET, '/users')
        .addPipe(({ response }) => {
          response.body = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
        }),
      
      new Route(EMethod.POST, '/users')
        .addPipe(jsonBodyPipe)
        .addPipe(({ state, response }) => {
          const userData = state.get('body');
          if (!userData.name) {
            throw new BadRequestError('Name is required');
          }
          response.body = { id: 3, ...userData };
          response.status = 201;
        }),
      
      new Route(EMethod.GET, '/users/:id')
        .addPipe(({ match, response }) => {
          const userId = parseInt(match.params.id);
          if (isNaN(userId)) {
            throw new RequestError('Invalid user ID', 400);
          }
          response.body = { id: userId, name: `User ${userId}` };
        })
    ];
  }

  await t.step('GET /users returns user list', async () => {
    const routes = createUserRoutes();
    const api = mockApi(...routes);
    
    await api.sendByArguments('GET', '/users');
    
    assertEquals(api.lastContext?.response.status, 200);
    assertArrayIsArray(api.lastContext?.response.body);
    assertEquals(api.lastContext?.response.body.length, 2);
  });

  await t.step('POST /users creates new user', async () => {
    const routes = createUserRoutes();
    const api = mockApi(...routes);
    
    const newUser = { name: 'Charlie', email: 'charlie@example.com' };
    const request = mockRequest('POST', '/users', newUser);
    
    await api.sendByRequest(request);
    
    assertEquals(api.lastContext?.response.status, 201);
    assertEquals(api.lastContext?.response.body.name, 'Charlie');
    assertEquals(api.lastContext?.response.body.id, 3);
  });

  await t.step('POST /users with invalid data throws error', async () => {
    const routes = createUserRoutes();
    const api = mockApi(...routes);
    
    const request = mockRequest('POST', '/users', {});
    
    await api.sendByRequest(request);
    
    assertEquals(api.lastContext?.response.status, 400);
  });

  await t.step('GET /users/:id returns specific user', async () => {
    const routes = createUserRoutes();
    const api = mockApi(...routes);
    
    await api.sendByArguments('GET', '/users/42');
    
    assertEquals(api.lastContext?.response.status, 200);
    assertEquals(api.lastContext?.response.body, { id: 42, name: 'User 42' });
  });

  await t.step('GET /users/:id with invalid ID throws error', async () => {
    const routes = createUserRoutes();
    const api = mockApi(...routes);
    
    await api.sendByArguments('GET', '/users/abc');
    
    assertEquals(api.lastContext?.response.status, 400);
  });
});
```

### Complete Pipe Test Example

```typescript
import { assertEquals } from '../src/dev_deps.ts';
import { mockContext } from '../dev_mod.ts';
import { IContext } from '../mod.ts';

// Pipe to test
function loggingPipe(context: IContext) {
  const startTime = Date.now();
  
  console.log(`[${new Date(startTime).toISOString()}] ` +
    `${context.request.method} ${context.request.url}`);
  
  context.state.set('startTime', startTime);
}

function timingPipe(context: IContext) {
  const startTime = context.state.get('startTime');
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`Request took ${duration}ms`);
  context.response.headers.set('X-Response-Time', duration.toString());
}

Deno.test('Logging and Timing Pipes', async (t) => {
  await t.step('loggingPipe sets startTime in state', async () => {
    const context = mockContext({
      request: {
        method: 'GET',
        url: '/test'
      } as any
    });
    
    await loggingPipe(context);
    
    assertEquals(context.state.has('startTime'), true);
    assertEquals(typeof context.state.get('startTime'), 'number');
  });

  await t.step('timingPipe calculates duration correctly', async () => {
    const startTime = Date.now();
    const context = mockContext({
      request: {} as any,
      response: {
        headers: new Headers()
      }
    });
    
    context.state.set('startTime', startTime);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await timingPipe(context);
    
    const duration = parseInt(context.response.headers.get('X-Response-Time') || '0');
    assertEquals(duration >= 10, true);
    assertEquals(duration < 100, true); // Should be less than 100ms
  });

  await t.step('pipes work together in chain', async () => {
    const context = mockContext({
      request: {
        method: 'POST',
        url: '/api/data'
      } as any,
      response: {
        headers: new Headers()
      }
    });
    
    // Chain pipes
    await loggingPipe(context);
    await new Promise(resolve => setTimeout(resolve, 5));
    await timingPipe(context);
    
    // Verify both pipes executed
    assertEquals(context.state.has('startTime'), true);
    assertEquals(context.response.headers.has('X-Response-Time'), true);
  });
});
```

## Test Utilities Reference

### Mock Functions

**`mockFn(implementation?)`**
- Creates a mock function with call tracking
- `implementation`: Optional function implementation
- Returns a function with `mock` property

**Mock Object Properties:**
- `mock.calls`: Array of call arguments
- `mock.returns`: Array of return values
- `mock.clear()`: Clears call history
- `mock.implement(fn)`: Changes implementation

### Mock API

**`mockApi(...routes)`**
- Creates a mock API instance for testing
- Accepts one or more routes
- Provides test-friendly API

**Mock API Properties:**
- `lastRoute`: Last matched route
- `lastContext`: Last execution context
- `mockInjections(injections)`: Override route injections

**Mock API Methods:**
- `sendByArguments(method, url, body?)`: Send mock request
- `sendByRequest(request)`: Send mock request object

### Mock Request/Response

**`mockRequest(method, url, body?, headers?)`**
- Creates a mock request object
- `method`: HTTP method
- `url`: Request URL
- `body`: Request body (optional)
- `headers`: Request headers (optional)

**`mockResponse()`**
- Creates a mock response object
- Includes `status`, `headers`, `body` properties

**`mockContext(settings)`**
- Creates a mock context object
- `settings`: Partial context settings

## Running Tests

### Basic Test Commands

```bash
# Run all tests
deno test --allow-all --no-check

# Run tests in watch mode
deno test --allow-all --no-check --watch

# Run specific test file
deno test --allow-all --no-check tests/user.service.test.ts

# Run tests with coverage
deno test --allow-all --no-check --coverage=cov_profile
```

### Test Configuration

Add to your `deno.json`:

```json
{
  "tasks": {
    "test": "deno test --allow-all --no-check",
    "test:watch": "deno test --allow-all --no-check --watch",
    "test:cov": "deno test --allow-all --no-check --coverage=cov_profile",
    "cov": "deno coverage cov_profile"
  }
}
```

### CI/CD Testing

Example GitHub Actions workflow:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Run tests
        run: deno test --allow-all --no-check
      
      - name: Check formatting
        run: deno fmt --check
      
      - name: Lint
        run: deno lint
```

## Advanced Testing Techniques

### Snapshot Testing

```typescript
import { assertEquals } from '../src/dev_deps.ts';
import { mockApi } from '../dev_mod.ts';

Deno.test('API response matches snapshot', async () => {
  const route = new Route(EMethod.GET, '/data')
    .addPipe(({ response }) => {
      response.body = {
        users: [{ id: 1, name: 'Alice' }],
        timestamp: new Date().toISOString()
      };
    });
  
  const api = mockApi(route);
  await api.sendByArguments('GET', '/data');
  
  const response = api.lastContext?.response;
  
  // For deterministic snapshots, remove dynamic data
  delete response.body.timestamp;
  
  assertEquals(response.body, {
    users: [{ id: 1, name: 'Alice' }]
  });
});
```

### Property-Based Testing

```typescript
import { assert } from '../src/dev_deps.ts';

Deno.test('calculateTotal is commutative', () => {
  const numbers1 = [1, 2, 3, 4, 5];
  const numbers2 = [5, 4, 3, 2, 1];
  
  const result1 = calculateTotal(numbers1);
  const result2 = calculateTotal(numbers2);
  
  assert(result1 === result2, 'calculateTotal should be commutative');
});

Deno.test('calculateTotal handles edge cases', () => {
  assert(calculateTotal([]) === 0, 'Empty array should return 0');
  assert(calculateTotal([0]) === 0, 'Single zero should return 0');
  assert(calculateTotal([-1, 1]) === 0, 'Negative and positive should cancel');
});
```

### Performance Testing

```typescript
Deno.test('userService.getUsers performance', async () => {
  const service = new UserService();
  
  // Warm up
  await service.getUsers();
  
  // Measure performance
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    await service.getUsers();
  }
  const end = performance.now();
  
  const avgTime = (end - start) / 100;
  console.log(`Average time: ${avgTime}ms`);
  
  // Assert performance requirements
  assert(avgTime < 50, 'getUsers should average less than 50ms');
});
```

## Testing Anti-Patterns

### What to Avoid

1. **Over-mocking**: Don't mock everything - test real behavior when possible
2. **Testing implementation**: Test what code does, not how it does it
3. **Slow tests**: Avoid tests that take seconds to run
4. **Flaky tests**: Tests that sometimes pass/fail unpredictably
5. **Too many assertions**: Focus on key behaviors
6. **Testing framework code**: Don't test deno-api-server itself

### Bad vs Good Examples

**Bad: Testing implementation details**
```typescript
// Don't test internal pipe structure
Deno.test('pipe has 3 internal functions', () => {
  const pipe = createComplexPipe();
  assertEquals(pipe.internalFunctions.length, 3); // Too implementation-focused
});
```

**Good: Testing behavior**
```typescript
// Test what the pipe does
Deno.test('complexPipe transforms data correctly', async () => {
  const context = mockContext({ /* ... */ });
  await complexPipe(context);
  assertEquals(context.response.body.transformed, true);
});
```

**Bad: Overly complex test setup**
```typescript
Deno.test('user creation', async () => {
  // 50 lines of complex setup...
  const db = setupComplexDatabase();
  const cache = setupRedisCache();
  const emailService = setupEmailService();
  const service = new UserService(db, cache, emailService);
  // ...
});
```

**Good: Simple, focused test**
```typescript
Deno.test('user creation with mocks', async () => {
  const mockDb = { createUser: mockFn(() => Promise.resolve({ id: 1 })) };
  const service = new UserService(mockDb);
  
  const user = await service.createUser({ name: 'Test' });
  
  assertEquals(user.id, 1);
  assertEquals(mockDb.createUser.mock.calls.length, 1);
});
```

## Resources

- [Deno Testing Documentation](https://deno.land/manual/testing)
- [TypeScript Testing Patterns](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)
- [Mocking Best Practices](https://martinfowler.com/articles/mocksArentStubs.html)

## Summary

deno-api-server provides comprehensive testing utilities that make it easy to:

✅ **Test individual pipes** in isolation
✅ **Test complete routes** with mock requests
✅ **Mock dependencies** for focused testing
✅ **Test error cases** and edge conditions
✅ **Create integration tests** with real components

By following the patterns and best practices in this guide, you can build robust, well-tested API servers with confidence.