# Best Practices

This guide covers best practices for building robust, maintainable applications with deno-api-server.

## Table of Contents

- [Project Organization](#project-organization)
- [Route Design](#route-design)
- [Pipe Architecture](#pipe-architecture)
- [Error Handling](#error-handling)
- [State Management](#state-management)
- [Dependency Injection](#dependency-injection)
- [Security](#security)
- [Performance](#performance)
- [Testing](#testing)
- [Documentation](#documentation)
- [Code Style](#code-style)

## Project Organization

### Directory Structure

A well-organized project is easier to maintain and scale:

```
my-api/
├── main.ts                 # Application entry point
├── config.ts               # Configuration management
├── types.ts                # Shared TypeScript types
│
├── routes/                # Route definitions
│   ├── index.ts           # Route exports
│   ├── users.ts           # User routes
│   ├── products.ts        # Product routes
│   └── auth.ts            # Auth routes
│
├── pipes/                 # Reusable pipes
│   ├── index.ts           # Pipe exports
│   ├── auth.pipe.ts       # Authentication pipe
│   ├── validation.pipe.ts # Validation pipe
│   └── error.pipe.ts      # Error handling pipe
│
├── services/              # Business logic
│   ├── index.ts          # Service exports
│   ├── user.service.ts    # User service
│   ├── product.service.ts # Product service
│   └── auth.service.ts    # Auth service
│
├── middleware/            # Global middleware
│   ├── cors.pipe.ts       # CORS handling
│   ├── logging.pipe.ts    # Request logging
│   └── rate-limit.pipe.ts # Rate limiting
│
├── models/                # Data models
│   ├── user.model.ts      # User model
│   └── product.model.ts   # Product model
│
├── utils/                 # Utility functions
│   ├── validators.ts      # Input validators
│   ├── formatters.ts      # Data formatters
│   └── helpers.ts        # Helper functions
│
├── tests/                 # Test files
│   ├── routes/            # Route tests
│   ├── pipes/             # Pipe tests
│   ├── services/          # Service tests
│   └── integration/       # Integration tests
│
└── plugins/               # Custom plugins
    ├── cache.plugin.ts    # Caching plugin
    └── metrics.plugin.ts  # Metrics plugin
```

### File Naming Conventions

- **Routes**: `*.routes.ts` (e.g., `users.routes.ts`)
- **Services**: `*.service.ts` (e.g., `user.service.ts`)
- **Pipes**: `*.pipe.ts` (e.g., `auth.pipe.ts`)
- **Models**: `*.model.ts` (e.g., `user.model.ts`)
- **Tests**: `*.test.ts` (e.g., `users.test.ts`)

### Entry Point Organization

```typescript
// main.ts
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import { loadConfig } from "./config.ts";
import { registerRoutes } from "./routes/index.ts";
import { registerMiddleware } from "./middleware/index.ts";
import { registerPlugins } from "./plugins/index.ts";

const config = loadConfig();
const api = new Api(config);

// Register plugins
registerPlugins(api);

// Register middleware
registerMiddleware(api);

// Register routes
registerRoutes(api);

console.log(`Server starting on port ${config.port}`);
await api.listen();
```

## Route Design

### Route Grouping

Group related routes together for better organization:

```typescript
// routes/users.ts
import { EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
import { userController } from "../controllers/user.controller.ts";
import { authPipe } from "../pipes/auth.pipe.ts";
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

export function createUserRoutes() {
  return [
    // Public routes
    new Route(EMethod.POST, "/users")
      .addPipe(jsonBodyPipe)
      .addPipe(userController.create),

    // Protected routes
    new Route(EMethod.GET, "/users")
      .addPipe(authPipe)
      .addPipe(userController.list),

    new Route(EMethod.GET, "/users/:id")
      .addPipe(authPipe)
      .addPipe(userController.getOne),

    new Route(EMethod.PATCH, "/users/:id")
      .addPipe(authPipe)
      .addPipe(jsonBodyPipe)
      .addPipe(userController.update),

    new Route(EMethod.DELETE, "/users/:id")
      .addPipe(authPipe)
      .addPipe(userController.delete),
  ];
}
```

### RESTful Route Patterns

Follow REST conventions for consistent APIs:

```typescript
// Good: RESTful routes
GET    /users          # List users
GET    /users/:id      # Get single user
POST   /users          # Create user
PUT    /users/:id      # Replace user
PATCH  /users/:id      # Update user
DELETE /users/:id      # Delete user

// Good: Nested resources
GET    /users/:id/posts      # Get user's posts
POST   /users/:id/posts      # Create post for user
GET    /users/:id/posts/:id  # Get specific post

// Avoid: Non-RESTful routes
GET    /getAllUsers
POST   /createUser
DELETE /removeUser/:id
GET    /userById/:id
```

### Route Ordering

Order routes from most specific to least specific:

```typescript
// Good: Specific routes first
api.addRoute(new Route(EMethod.GET, "/users/:id/posts/:id"));
api.addRoute(new Route(EMethod.GET, "/users/:id/posts"));
api.addRoute(new Route(EMethod.GET, "/users/:id"));
api.addRoute(new Route(EMethod.GET, "/users"));

// Avoid: General routes first
api.addRoute(new Route(EMethod.GET, "/users"));
api.addRoute(new Route(EMethod.GET, "/users/:id")); // Will never match
```

### Route Versioning

Version your APIs for backward compatibility:

```typescript
// Good: URL-based versioning
api.addRoute(new Route(EMethod.GET, "/v1/users"));
api.addRoute(new Route(EMethod.GET, "/v2/users"));

// Good: Header-based versioning
function versionPipe({ request, state }: IContext) {
  const version = request.headers.get("API-Version") || "v1";
  state.set("version", version);
}

new Route(EMethod.GET, "/users")
  .addPipe(versionPipe)
  .addPipe(({ state, response }) => {
    const version = state.get("version");
    response.body = version === "v2" ? v2Response : v1Response;
  });
```

## Pipe Architecture

### Single Responsibility

Each pipe should do one thing well:

```typescript
// Good: Focused pipes
new Route(EMethod.POST, "/users")
  .addPipe(jsonBodyPipe)           // Parse JSON
  .addPipe(validateUserPipe)        // Validate input
  .addPipe(sanitizeInputPipe)       // Sanitize data
  .addPipe(createUserPipe);         // Create user

// Avoid: Do-everything pipe
new Route(EMethod.POST, "/users")
  .addPipe(({ request, response }) => {
    // Parse, validate, sanitize, create - too much
  });
```

### Pipe Reusability

Create reusable, composable pipes:

```typescript
// pipes/auth.pipe.ts
export function requireAuthPipe(roles?: string[]) {
  return ({ request, state }: IContext) => {
    const token = request.headers.get("Authorization");
    const user = verifyToken(token);

    if (roles && !roles.includes(user.role)) {
      throw new AccessDeniedError("Insufficient permissions");
    }

    state.set("user", user);
  };
}

// Usage
new Route(EMethod.GET, "/admin/users")
  .addPipe(requireAuthPipe(["admin"]));

new Route(EMethod.GET, "/profile")
  .addPipe(requireAuthPipe());
```

### Pipe Factories

Use factory functions for configurable pipes:

```typescript
// pipes/validation.pipe.ts
interface ValidationConfig {
  schema: ValidationSchema;
  onFail?: (errors: ValidationError[]) => void;
}

export function validationPipe(config: ValidationConfig) {
  return async ({ state, response }: IContext) => {
    const data = state.get("body");
    const errors = await validate(data, config.schema);

    if (errors.length > 0) {
      response.body = { errors };
      if (config.onFail) {
        config.onFail(errors);
      }
      throw new BadRequestError("Validation failed");
    }

    state.set("validated", data);
  };
}

// Usage
new Route(EMethod.POST, "/users")
  .addPipe(jsonBodyPipe)
  .addPipe(validationPipe({
    schema: userSchema,
    onFail: (errors) => console.log("Validation failed:", errors)
  }));
```

### Error Handling in Pipes

Always handle errors appropriately:

```typescript
// Good: Proper error handling
function databasePipe({ di, state }: IContext) {
  try {
    const data = di.db.query("SELECT * FROM users");
    state.set("users", data);
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw new RequestError("Database error", 503);
    }
    throw error; // Re-throw unknown errors
  }
}

// Avoid: Silent failures
function badPipe({ state }: IContext) {
  try {
    // Do something
  } catch (error) {
    console.error(error);
    // Error is swallowed - bad practice
  }
}
```

## Error Handling

### Use Proper Error Types

```typescript
// Good: Use specific error types
import {
  RequestError,
  BadRequestError,
  AccessDeniedError,
  NotFoundError,
  IllegalArgumentError
} from "https://deno.land/x/deno_api_server/mod.ts";

function getUserPipe({ match, di, response }: IContext) {
  const user = di.userService.getById(match.params.id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  response.body = user;
}

function validatePipe({ state }: IContext) {
  const data = state.get("body");

  if (!data.email) {
    throw new BadRequestError("Email is required");
  }

  if (!isValidEmail(data.email)) {
    throw new IllegalArgumentError("Invalid email format");
  }
}

function authPipe({ request }: IContext) {
  const token = request.headers.get("Authorization");

  if (!token) {
    throw new AccessDeniedError("Missing authorization header");
  }
}

// Avoid: Generic errors
function badPipe() {
  throw new Error("Something went wrong"); // Returns 500
}
```

### Global Error Handler

Implement a global error handler for consistent responses:

```typescript
// middleware/error.pipe.ts
import { EEvent, ErrorEvent } from "https://deno.land/x/deno_api_server/mod.ts";

export function setupErrorHandler(api: Api) {
  api.handleError = (response, error) => {
    if (error instanceof RequestError) {
      response.status = error.status || 500;
      response.body = {
        error: error.message,
        code: error.status
      };
    } else {
      // Unexpected error
      response.status = 500;
      response.body = {
        error: "Internal Server Error",
        code: 500
      };

      // Log unexpected errors
      console.error("Unexpected error:", error);
    }
  };

  // Track errors
  addEventListener(EEvent.ROUTE_ERROR, (event) => {
    if (event instanceof ErrorEvent) {
      logError(event.error, event.route);
    }
  });
}
```

### Error Response Format

Maintain consistent error responses:

```typescript
// Good: Structured error responses
{
  "error": "User not found",
  "code": 404,
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "abc123"
}

// Good: Validation errors
{
  "error": "Validation failed",
  "code": 400,
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "age", "message": "Must be a positive number" }
  ]
}
```

## State Management

### Use State for Pipe Communication

Use state to pass data between pipes in the same request:

```typescript
// Good: State for pipe communication
new Route(EMethod.POST, "/users")
  .addPipe(jsonBodyPipe)                    // Sets state.body
  .addPipe(validationPipe)                   // Uses state.body, sets state.validated
  .addPipe(authPipe)                        // Sets state.user
  .addPipe(async ({ state, di }) => {       // Uses state.validated
    const user = await di.userService.create(state.get("validated"));
    state.set("createdUser", user);
  })
  .addPipe(({ state, response }) => {       // Uses state.createdUser
    response.body = state.get("createdUser");
  });
```

### Clean Up State

Remove sensitive or large data from state when no longer needed:

```typescript
new Route(EMethod.POST, "/upload")
  .addPipe(async ({ state }) => {
    const fileData = await readFile(state.get("file"));
    state.set("fileData", fileData);
  })
  .addPipe(async ({ state, response }) => {
    const result = await processData(state.get("fileData"));
    state.delete("fileData"); // Clean up large data
    response.body = result;
  });
```

### Avoid Global State

Prefer context.state over global variables:

```typescript
// Good: Use context state
function pipe1({ state }: IContext) {
  state.set("startTime", Date.now());
}

function pipe2({ state, response }: IContext) {
  const duration = Date.now() - state.get("startTime");
  response.headers.set("X-Response-Time", duration);
}

// Avoid: Global state
let globalStartTime = 0;

function pipe1() {
  globalStartTime = Date.now();
}

function pipe2({ response }: IContext) {
  response.headers.set("X-Response-Time", Date.now() - globalStartTime);
}
```

## Dependency Injection

### Inject Services, Not Data

Inject service instances, not static data:

```typescript
// Good: Inject services
const route = new Route(EMethod.GET, "/users")
  .injections({
    userService: new UserService(dbConnection),
    cacheService: new CacheService(redisConnection)
  })
  .addPipe(({ di, response }) => {
    const users = di.userService.getAll();
    response.body = users;
  });

// Avoid: Inject static data
const route = new Route(EMethod.GET, "/users")
  .injections({
    users: [] // Static data - not testable
  })
  .addPipe(({ di, response }) => {
    response.body = di.users;
  });
```

### Mockable Injections

Make injections easy to mock for testing:

```typescript
// Good: Use interfaces/factories
interface IUserService {
  getById(id: number): Promise<User>;
  getAll(): Promise<User[]>;
  create(data: UserInput): Promise<User>;
}

const route = new Route(EMethod.GET, "/users/:id")
  .injections({
    userService: new UserService(db)
  })
  .addPipe(async ({ di, match, response }) => {
    const user = await di.userService.getById(match.params.id);
    response.body = user;
  });

// Test with mock
api.mockInjections({
  userService: {
    getById: (id) => Promise.resolve({ id, name: "Mock User" })
  }
});
```

### Shared vs Route-Specific Injections

Choose the right scope for your injections:

```typescript
// Good: Shared injections for common services
const api = new Api({ port: 8080 });

api.injections({
  db: databaseConnection,
  logger: loggerService,
  config: appConfig
});

// Routes use shared injections
const route1 = new Route(EMethod.GET, "/users")
  .addPipe(({ di, response }) => {
    response.body = di.db.query("SELECT * FROM users");
  });

// Good: Route-specific injections for unique dependencies
const route2 = new Route(EMethod.GET, "/special")
  .injections({
    specialService: new SpecialService(config)
  })
  .addPipe(({ di, response }) => {
    response.body = di.specialService.getData();
  });
```

## Security

### Input Validation

Always validate and sanitize user input:

```typescript
// Good: Validate input
new Route(EMethod.POST, "/users")
  .addPipe(jsonBodyPipe)
  .addPipe(({ state }) => {
    const data = state.get("body");

    // Validate required fields
    if (!data.name) {
      throw new BadRequestError("Name is required");
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      throw new BadRequestError("Invalid email");
    }

    // Sanitize input
    data.name = sanitizeHtml(data.name);
    data.email = sanitizeEmail(data.email);
  })
  .addPipe(createUserPipe);
```

### Authentication and Authorization

Implement proper auth and authorization:

```typescript
// Good: Separate auth and authorization
function authPipe({ request, state }: IContext) {
  const token = request.headers.get("Authorization");

  if (!token) {
    throw new AccessDeniedError("Missing token", 401);
  }

  const user = verifyToken(token);
  state.set("user", user);
}

function requireRolePipe(roles: string[]) {
  return ({ state }: IContext) => {
    const user = state.get("user");

    if (!roles.includes(user.role)) {
      throw new AccessDeniedError("Insufficient permissions", 403);
    }
  };
}

// Usage
new Route(EMethod.GET, "/admin/users")
  .addPipe(authPipe)
  .addPipe(requireRolePipe(["admin"]))
  .addPipe(handlerPipe);
```

### CORS Configuration

Configure CORS for cross-origin requests:

```typescript
// pipes/cors.pipe.ts
interface CorsConfig {
  origins: string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
}

export function corsPipe(config: CorsConfig) {
  return ({ request, response }: IContext) => {
    const origin = request.headers.get("Origin");

    if (origin && config.origins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", config.methods.join(", "));
      response.headers.set("Access-Control-Allow-Headers", config.headers.join(", "));

      if (config.credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }
    }

    if (request.method === "OPTIONS") {
      response.status = 204;
      return; // Don't continue pipeline
    }
  };
}

// Usage
const corsConfig = {
  origins: ["https://example.com", "https://app.example.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  headers: ["Content-Type", "Authorization"],
  credentials: true
};

// Apply to all routes
addEventListener(EEvent.BEFORE_REQUEST, (event) => {
  if (event instanceof RequestEvent) {
    corsPipe(corsConfig)({ request: event.request, response: event.response });
  }
});
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// pipes/rate-limit.pipe.ts
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimitPipe(config: RateLimitConfig) {
  const requests = new Map<string, number[]>();

  return ({ request, response }: IContext) => {
    const ip = request.headers.get("X-Forwarded-For") || "unknown";
    const now = Date.now();

    // Clean old requests
    const recentRequests = (requests.get(ip) || []).filter(
      timestamp => now - timestamp < config.windowMs
    );

    if (recentRequests.length >= config.maxRequests) {
      throw new RequestError("Too many requests", 429);
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);
  };
}

// Usage
new Route(EMethod.POST, "/api")
  .addPipe(rateLimitPipe({ maxRequests: 100, windowMs: 60000 }))
  .addPipe(handlerPipe);
```

## Performance

### Pipe Ordering

Order pipes by performance impact:

```typescript
// Good: Fast checks first
new Route(EMethod.POST, "/users")
  .addPipe(authPipe)              // Fast: check token
  .addPipe(rateLimitPipe)         // Fast: check rate limit
  .addPipe(validationPipe)         // Medium: validate input
  .addPipe(sanitizePipe)          // Medium: sanitize input
  .addPipe(databasePipe);          // Slow: database query

// Avoid: Slow checks first
new Route(EMethod.POST, "/users")
  .addPipe(databasePipe)           // Slow: always hits DB
  .addPipe(authPipe)              // Fast: but DB already called
  .addPipe(validationPipe);        // Medium: but DB already called
```

### Caching

Implement caching for expensive operations:

```typescript
// pipes/cache.pipe.ts
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: (context: IContext) => string;
}

export function cachePipe(config: CacheConfig) {
  const cache = new Map<string, { data: any; expiry: number }>();

  return async (context: IContext) => {
    const key = config.key(context);
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      context.response.body = cached.data;
      return; // Don't continue pipeline
    }
  };
}

// Cache response
export function cacheResponsePipe(config: CacheConfig) {
  const cache = new Map<string, { data: any; expiry: number }>();

  return async (context: IContext) => {
    const key = config.key(context);

    // Check cache
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      context.response.body = cached.data;
      return;
    }

    // Continue to next pipes
  };

  // Cache result
  addEventListener(EEvent.AFTER_ROUTE, (event) => {
    if (event instanceof RouteEvent) {
      const key = config.key(event.context);
      cache.set(key, {
        data: event.context.response.body,
        expiry: Date.now() + config.ttl
      });
    }
  });
}
```

### Async Optimization

Use async only when necessary:

```typescript
// Good: Sync when possible
function loggingPipe({ request }: IContext) {
  console.log(`${request.method} ${request.url}`);
}

// Good: Async when needed
async function databasePipe({ di, state }: IContext) {
  const data = await di.db.query("SELECT * FROM users");
  state.set("users", data);
}

// Avoid: Unnecessary async
async function badPipe({ response }: IContext) {
  response.body = { message: "Hello" }; // No async operations
}
```

## Testing

### Test Routes in Isolation

```typescript
// Good: Test routes with mocks
Deno.test("GET /users returns list", async () => {
  const mockDb = { getUsers: () => [{ id: 1, name: "Alice" }] };
  const route = new Route(EMethod.GET, "/users")
    .injections({ db: mockDb })
    .addPipe(({ di, response }) => {
      response.body = di.db.getUsers();
    });

  const api = mockApi(route);
  await api.sendByArguments("GET", "/users");

  assertEquals(api.lastContext?.response.body, [{ id: 1, name: "Alice" }]);
});

// Avoid: Test with real database
Deno.test("GET /users returns list", async () => {
  const route = new Route(EMethod.GET, "/users")
    .injections({ db: realDbConnection }) // Slow and unreliable
    .addPipe(handler);

  // ...
});
```

### Test Error Cases

```typescript
// Good: Test both success and error cases
Deno.test("authPipe allows valid token", async () => {
  const pipe = createAuthPipe();
  const context = mockContext({
    request: mockRequest("GET", "/api", null, { "Authorization": "valid-token" })
  });

  await pipe(context);
  assertEquals(context.response.status, 200);
});

Deno.test("authPipe rejects invalid token", async () => {
  const pipe = createAuthPipe();
  const context = mockContext({
    request: mockRequest("GET", "/api", null, { "Authorization": "invalid-token" })
  });

  try {
    await pipe(context);
    throw new Error("Should have thrown");
  } catch (error) {
    assertEquals(error.status, 401);
  }
});
```

## Documentation

### Document Routes

```typescript
/**
 * User Routes
 *
 * Handles all user-related endpoints
 *
 * @package routes
 */

import { EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

/**
 * GET /users
 *
 * Returns a list of all users
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 *
 * @response 200 - Array of users
 * @response 500 - Internal server error
 */
export const listUsersRoute = new Route(EMethod.GET, "/users")
  .addPipe(listUsersPipe);
```

### Document Pipes

```typescript
/**
 * Authentication Pipe
 *
 * Validates JWT tokens and adds user to context state
 *
 * @param config - Configuration options
 * @param config.secret - JWT secret for verification
 * @param config.required - Whether authentication is required (default: true)
 *
 * @throws AccessDeniedError - When token is missing or invalid
 *
 * @example
 * ```typescript
 * new Route(EMethod.GET, "/protected")
 *   .addPipe(authPipe({ secret: "my-secret", required: true }))
 *   .addPipe(handlerPipe);
 * ```
 */
export function authPipe(config: AuthConfig) {
  return ({ request, state }: IContext) => {
    // Implementation
  };
}
```

## Code Style

### Use TypeScript Strictly

```typescript
// Good: Explicit types
interface IUser {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<IUser> {
  // Implementation
}

// Avoid: Implicit types
function getUser(id) {
  // Missing types
}
```

### Use Named Exports

```typescript
// Good: Named exports
export function createUserPipe() { }
export function deleteUserPipe() { }

// Use: import { createUserPipe } from "./pipes";

// Avoid: Default exports
export default function createUserPipe() { }

// Use: import createUserPipe from "./pipes";
```

### Follow Functional Patterns

```typescript
// Good: Functional, pure pipes
function transformPipe(data: any) {
  return {
    ...data,
    transformed: true
  };
}

// Avoid: Side effects
function badPipe({ response }: IContext) {
  globalCounter++; // Side effect
  response.body = { value: globalCounter };
}
```

## Additional Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](TESTING.md)
- [Plugins Guide](PLUGINS.md)
- [Examples Guide](EXAMPLES.md)
