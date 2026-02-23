# API Documentation

This document provides comprehensive documentation for the deno-api-server framework API.

## Table of Contents

- [Core Classes](#core-classes)
  - [Api](#api)
  - [Route](#route)
  - [Context](#context)
- [Routing](#routing)
  - [Matchers](#matchers)
  - [URLPattern](#urlpattern)
  - [KeyMatch](#keymatch)
- [Pipes](#pipes)
  - [Built-in Pipes](#built-in-pipes)
  - [Creating Custom Pipes](#creating-custom-pipes)
- [Dependency Injection](#dependency-injection)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Events System](#events-system)
- [Testing Utilities](#testing-utilities)
- [Configuration](#configuration)

## Core Classes

### Api

The main server class that handles HTTP requests and manages routes.

#### Constructor

```typescript
new Api(config: IServerConfig)
```

**Parameters:**
- `config`: Server configuration object
  - `port`: Port number (default: 8080)
  - `hostname`: Hostname (optional)
  - `onListen`: Callback when server starts listening

**Example:**
```typescript
const api = new Api({ 
  port: 3000, 
  hostname: "localhost",
  onListen: () => console.log("Server started!")
});
```

#### Methods

**`addRoute(route: IRoute): Api`**
Adds a route to the API server.

```typescript
api.addRoute(new Route(EMethod.GET, "/users"));
```

**`listen(): Promise<void>`**
Starts the HTTP server.

```typescript
await api.listen();
```

**`getRouteByRequest(request: Request): IRoute | null`**
Finds a matching route for a given request.

**`handleError(response: IResponse, error: Error): void`**
Default error handler (can be overridden).

#### Properties

**`serverConfig: IServerConfig`** - The server configuration
**`routes: IRoute[]`** - Array of registered routes

### Route

Defines an API endpoint with HTTP method(s) and URI pattern.

#### Constructor

```typescript
new Route(method: EMethod | EMethod[], uri: string | IMatcher)
```

**Parameters:**
- `method`: HTTP method(s) - single method or array of methods
- `uri`: URI pattern (string) or matcher instance

**Example:**
```typescript
// Single method
const getRoute = new Route(EMethod.GET, "/users");

// Multiple methods
const multiRoute = new Route([EMethod.GET, EMethod.POST], "/items");

// With matcher
const patternRoute = new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }));
```

#### Methods

**`addPipe(pipe: IPipe): Route`**
Adds a pipe function to the route's processing pipeline.

```typescript
route.addPipe(async (context) => {
  // Process request
  context.response.body = { processed: true };
});
```

**`injections(injections: Record<string, any>): Route`**
Adds dependency injections for the route.

```typescript
route.injections({
  userService: new UserService(),
  logger: new Logger()
});
```

**`prop(name: string, value: any): Route`**
Sets a property on the route.

**`execute(url: URL, request: Request, response: IResponse): Promise<IContext>`**
Executes the route pipeline.

#### Properties

**`methods: EMethod[]`** - Array of HTTP methods
**`matcher: IMatcher`** - The URI matcher
**`pipes: IPipe[]`** - Array of pipe functions
**`di: Record<string, any>`** - Dependency injections
**`props: Map<string, any>`** - Route properties

### Context

The context object passed through the pipe chain.

#### Properties

**`request: Request`** - The HTTP request
**`response: IResponse`** - The HTTP response
**`state: IState`** - State management
**`match: IMatchResult`** - Route matching result
**`di: Record<string, any>`** - Dependency injections
**`url: URL`** - Parsed URL

## Routing

### Matchers

Matchers determine if a route matches a given URL.

#### IMatcher Interface

```typescript
interface IMatcher {
  uri: string;
  getMatch(url: URL): IMatchResult | null;
}
```

### URLPattern

Standard web URL pattern matching.

```typescript
import { URLPattern } from "https://deno.land/x/deno_api_server/mod.ts";

const pattern = new URLPattern({ pathname: "/users/:id" });
const route = new Route(EMethod.GET, pattern);

// In a pipe:
route.addPipe(({ match }) => {
  const userId = match.params.id; // "123" from "/users/123"
});
```

### KeyMatch

Advanced pattern matching with type conversion.

```typescript
import { KeyMatch } from "https://deno.land/x/deno_api_server/mod.ts";

const matcher = new KeyMatch("/users/:id", {
  id: { type: "number" } // Automatically converts to number
});

const route = new Route(EMethod.GET, matcher);

// In a pipe:
route.addPipe(({ match }) => {
  const userId = match.params.id; // 123 as number from "/users/123"
});
```

#### KeyMatch Types

- `"any"` - Any string value (default)
- `"number"` - Numeric values
- `"int"` - Integer values
- `"alpha"` - Alphabetic values
- `"hash"` - Hash values
- `"rest"` - Rest of URL path

#### Custom Patterns

```typescript
const matcher = new KeyMatch("/users/:username", {
  username: {
    describe: {
      pattern: "[a-zA-Z0-9_]+", // Regex pattern
      transform: (value) => value.toLowerCase() // Transform function
    }
  }
});
```

## Pipes

Pipes are the core processing units in deno-api-server. They're functions that process the context and can modify the request/response.

### Built-in Pipes

#### Body Pipes

**`rawBodyPipe`** - Reads raw request body
```typescript
import rawBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/raw-body.pipe.ts";

route.addPipe(rawBodyPipe);
// Sets state.body with raw string data
// Sets state.bodyType = "raw"
```

**`jsonBodyPipe`** - Parses JSON request body
```typescript
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

route.addPipe(jsonBodyPipe);
// Sets state.body with parsed JSON
// Sets state.bodyType = "json"
// Throws 400 error if invalid JSON
```

**`formBodyPipe`** - Parses form data
```typescript
import formBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/form-body.pipe.ts";

route.addPipe(formBodyPipe);
// Sets state.body with form data
// Sets state.bodyType = "form"
```

#### Process Pipes

**`redirectPipe`** - Redirects to another URL
```typescript
import redirectPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/redirect.pipe.ts";

route.addPipe(redirectPipe("/new-location"));
// Default 302 redirect

route.addPipe(redirectPipe("/new-location", 301));
// Permanent redirect
```

**`htmlPipe`** - Sends HTML response
```typescript
import htmlPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/html.pipe.ts";

route.addPipe(htmlPipe("<html><body>Hello</body></html>"));
```

**`filePipe`** - Serves static files
```typescript
import filePipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/file.pipe.ts";

route.addPipe(filePipe("/path/to/file.txt"));
// Optional options:
route.addPipe(filePipe("/path/to/file.txt", {
  contentType: "text/plain",
  statusCode: 200,
  noThrow: false
}));
```

### Creating Custom Pipes

A pipe is simply a function that takes a context:

```typescript
type IPipe = (context: IContext) => void | Promise<void>;
```

**Basic Pipe Example:**
```typescript
function loggingPipe(context: IContext) {
  console.log(`[${new Date().toISOString()}] ${context.request.method} ${context.request.url}`);
}

route.addPipe(loggingPipe);
```

**Async Pipe Example:**
```typescript
async function databasePipe(context: IContext) {
  const data = await db.query("SELECT * FROM users");
  context.state.set("users", data);
}

route.addPipe(databasePipe);
```

**Pipe with Error Handling:**
```typescript
function errorHandlingPipe(context: IContext) {
  try {
    // Process request
  } catch (error) {
    context.response.status = 500;
    context.response.body = { error: "Internal Server Error" };
  }
}
```

**Conditional Pipe:**
```typescript
function authPipe(context: IContext) {
  const authHeader = context.request.headers.get("Authorization");
  
  if (!authHeader || !isValidToken(authHeader)) {
    throw new AccessDeniedError("Unauthorized", 401);
  }
}
```

## Dependency Injection

Dependency Injection (DI) allows you to share services and dependencies between pipes.

### Adding Injections

```typescript
route.injections({
  // Simple value
  config: { apiKey: "12345" },
  
  // Service instance
  userService: new UserService(),
  
  // Factory function
  dbConnection: () => createDbConnection(),
  
  // Async factory
  cache: async () => await createCacheClient()
});
```

### Using Injections in Pipes

```typescript
route.addPipe(async (context) => {
  // Access injections via context.di
  const config = context.di.config;
  const userService = context.di.userService;
  const db = await context.di.dbConnection();
  
  const users = await userService.getUsers();
  context.response.body = users;
});
```

### Mocking Injections for Testing

```typescript
// In your test
const api = mockApi(route);

api.mockInjections({
  userService: {
    getUsers: () => Promise.resolve([{ id: 1, name: "Test" }])
  }
});

// Now your route will use the mock service
```

## State Management

The state object allows passing data between pipes in the same request.

### State Methods

**`state.set(key: string, value: any): void`** - Set a state value
**`state.get(key: string): any`** - Get a state value
**`state.has(key: string): boolean`** - Check if key exists
**`state.delete(key: string): void`** - Remove a state value
**`state.clear(): void`** - Clear all state

### State Example

```typescript
new Route(EMethod.POST, "/users")
  .addPipe(jsonBodyPipe) // Sets state.body
  .addPipe(({ state }) => {
    // Validate input
    const userData = state.get("body");
    if (!userData.name) {
      throw new BadRequestError("Name is required");
    }
    
    // Store validated data
    state.set("validatedUser", userData);
  })
  .addPipe(async ({ state, di }) => {
    // Use validated data
    const userData = state.get("validatedUser");
    const savedUser = await di.userService.createUser(userData);
    
    state.set("savedUser", savedUser);
  })
  .addPipe(({ response, state }) => {
    // Return result
    response.body = state.get("savedUser");
  });
```

## Error Handling

### Built-in Error Classes

**`RequestError`** - General request error
```typescript
throw new RequestError("Invalid input", 400);
```

**`BadRequestError`** - 400 Bad Request
```typescript
throw new BadRequestError("Missing required field");
```

**`AccessDeniedError`** - 403 Forbidden
```typescript
throw new AccessDeniedError("Insufficient permissions");
```

**`NotFoundError`** - 404 Not Found
```typescript
throw new NotFoundError("Resource not found");
```

**`IllegalArgumentError`** - 400 Bad Request (invalid arguments)
```typescript
throw new IllegalArgumentError("Invalid ID format");
```

### Custom Error Handling

Override the default error handler:

```typescript
class MyApi extends Api {
  handleError(response: IResponse, error: Error) {
    if (error instanceof RequestError) {
      response.status = error.status || 500;
      response.body = {
        error: error.message,
        code: error.status || 500,
        timestamp: new Date().toISOString()
      };
    } else {
      // Handle unexpected errors
      response.status = 500;
      response.body = {
        error: "Internal Server Error",
        code: 500
      };
      
      // Log the error
      console.error("Unexpected error:", error);
    }
  }
}
```

### Error Handling in Pipes

```typescript
function safePipe(context: IContext) {
  try {
    // Risky operation
    const result = riskyOperation();
    context.response.body = result;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new BadRequestError(error.message);
    } else if (error instanceof DatabaseError) {
      throw new RequestError("Database error", 503);
    } else {
      // Re-throw unexpected errors
      throw error;
    }
  }
}
```

## Events System

deno-api-server provides an event system that allows you to hook into various lifecycle points.

### Available Events

**`EEvent.API_ADD_ROUTE`** - Fired when a route is added to the API
- Payload: `RouteEvent` with `route` property

**`EEvent.BEFORE_REQUEST`** - Fired before request processing
- Payload: `RequestEvent` with `request`, `response`

**`EEvent.BEFORE_ROUTE`** - Fired before route execution
- Payload: `RouteEvent` with `route`, `request`, `response`

**`EEvent.AFTER_ROUTE`** - Fired after route execution
- Payload: `RouteEvent` with `route`, `request`, `response`, `context`

**`EEvent.ROUTE_NOT_FOUND`** - Fired when no route matches
- Payload: `RequestEvent`

**`EEvent.ROUTE_ERROR`** - Fired when route execution fails
- Payload: `ErrorEvent` with `error`, `route`, `request`, `response`

**`EEvent.CRITICAL_ERROR`** - Fired for critical errors
- Payload: `ErrorEvent`

### Using Events

```typescript
import { EEvent } from "https://deno.land/x/deno_api_server/src/definition/event.ts";
import RouteEvent from "https://deno.land/x/deno_api_server/src/definition/events/route.event.ts";

// Log all route additions
addEventListener(EEvent.API_ADD_ROUTE, (event) => {
  if (event instanceof RouteEvent) {
    console.log(`Route added: ${event.route.methods.join(", ")} ${event.route.matcher.uri}`);
  }
});

// Log all requests
addEventListener(EEvent.BEFORE_REQUEST, (event) => {
  if (event instanceof RequestEvent) {
    console.log(`Incoming request: ${event.request.method} ${event.request.url}`);
  }
});

// Global error logging
addEventListener(EEvent.ROUTE_ERROR, (event) => {
  if (event instanceof ErrorEvent) {
    console.error("Route error:", event.error);
  }
});
```

### Creating Custom Events

You can dispatch custom events:

```typescript
import { dispatchEvent } from "https://deno.land/x/deno_api_server/src/definition/event.ts";

// Create custom event
class CustomEvent extends Event {
  constructor(public data: any) {
    super("custom-event");
  }
}

// Dispatch event
dispatchEvent(new CustomEvent({ message: "Hello" }));

// Listen for event
addEventListener("custom-event", (event) => {
  if (event instanceof CustomEvent) {
    console.log("Custom event:", event.data);
  }
});
```

## Testing Utilities

deno-api-server includes comprehensive testing utilities.

### Mock API

```typescript
import { mockApi } from "https://deno.land/x/deno_api_server/dev_mod.ts";

Deno.test("GET /users returns 200", async () => {
  const route = new Route(EMethod.GET, "/users")
    .addPipe(({ response }) => {
      response.body = [{ id: 1, name: "Alice" }];
    });
  
  const api = mockApi(route);
  await api.sendByArguments("GET", "/users");
  
  assertEquals(api.lastContext?.response.status, 200);
  assertEquals(api.lastContext?.response.body, [{ id: 1, name: "Alice" }]);
});
```

### Mock Request/Response

```typescript
import { mockRequest, mockResponse, mockContext } from "https://deno.land/x/deno_api_server/dev_mod.ts";

Deno.test("Route execution", async () => {
  const route = new Route(EMethod.POST, "/users");
  const url = new URL("/users", "http://localhost");
  const request = mockRequest("POST", "/users", { name: "Bob" });
  const response = mockResponse();
  
  const context = await route.execute(url, request, response);
  
  assertEquals(context.response.status, 200);
});
```

### Mock Functions

```typescript
import { mockFn } from "https://deno.land/x/deno_api_server/dev_mod.ts";

Deno.test("Pipe calls function", async () => {
  const mockFunction = mockFn();
  
  const route = new Route(EMethod.GET, "/test")
    .addPipe(() => {
      mockFunction("called");
    });
  
  const api = mockApi(route);
  await api.sendByArguments("GET", "/test");
  
  assertEquals(mockFunction.mock.calls.length, 1);
  assertEquals(mockFunction.mock.calls[0], ["called"]);
});
```

### Mock Injections

```typescript
Deno.test("Route with mocked injections", async () => {
  const route = new Route(EMethod.GET, "/test")
    .injections({
      userService: {
        getUsers: () => [{ id: 1 }]
      }
    })
    .addPipe(({ response, di }) => {
      response.body = di.userService.getUsers();
    });
  
  const api = mockApi(route);
  
  // Override injections for testing
  api.mockInjections({
    userService: {
      getUsers: () => [{ id: 2 }] // Mock data
    }
  });
  
  await api.sendByArguments("GET", "/test");
  assertEquals(api.lastContext?.response.body, [{ id: 2 }]);
});
```

## Configuration

### Server Configuration

```typescript
interface IServerConfig {
  port?: number; // Default: 8080
  hostname?: string; // Default: "0.0.0.0"
  onListen?: (() => void) | (() => Promise<void>);
  signal?: AbortSignal; // For graceful shutdown
  [key: string]: any; // Custom properties
}
```

### Example Configurations

**Basic Configuration:**
```typescript
const api = new Api({
  port: 3000
});
```

**Advanced Configuration:**
```typescript
const api = new Api({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  onListen: () => {
    console.log(`Server started on port ${api.serverConfig.port}`);
  },
  // Custom properties
  environment: "production",
  logLevel: "info"
});
```

**With Graceful Shutdown:**
```typescript
const controller = new AbortController();

const api = new Api({
  port: 3000,
  signal: controller.signal
});

// Handle shutdown signals
Deno.addSignalListener("SIGINT", () => {
  console.log("Shutting down gracefully...");
  controller.abort();
});
```

## Best Practices

### Route Organization

```typescript
// routes/users.ts
import { EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

export function createUserRoutes() {
  return [
    new Route(EMethod.GET, "/users")
      .addPipe(getUsersPipe),
    
    new Route(EMethod.POST, "/users")
      .addPipe(jsonBodyPipe)
      .addPipe(createUserPipe),
    
    new Route(EMethod.GET, "/users/:id")
      .addPipe(getUserPipe)
  ];
}

// main.ts
import { createUserRoutes } from "./routes/users.ts";

const api = new Api({ port: 3000 });
createUserRoutes().forEach(route => api.addRoute(route));
```

### Pipe Composition

```typescript
// Create reusable pipes
function validationPipe(schema) {
  return async (context) => {
    const body = context.state.get("body");
    const [passes, errors] = await validate(body, schema);
    
    if (!passes) {
      context.response.status = 400;
      context.response.body = { errors };
      throw new Error("Validation failed");
    }
  };
}

function authPipe(requiredRole) {
  return (context) => {
    const user = context.state.get("user");
    
    if (!user || !user.roles.includes(requiredRole)) {
      throw new AccessDeniedError("Insufficient permissions");
    }
  };
}

// Use composed pipes
new Route(EMethod.POST, "/admin/users")
  .addPipe(jsonBodyPipe)
  .addPipe(authPipe("admin"))
  .addPipe(validationPipe(userSchema))
  .addPipe(createUserPipe);
```

### Error Handling Strategy

```typescript
// Create a centralized error handler pipe
function errorHandlerPipe(context: IContext) {
  try {
    // Your pipe logic here
  } catch (error) {
    if (error instanceof RequestError) {
      context.response.status = error.status;
      context.response.body = {
        error: error.message,
        code: error.status
      };
    } else {
      // Log unexpected errors
      console.error("Unexpected error:", error);
      context.response.status = 500;
      context.response.body = {
        error: "Internal Server Error",
        code: 500
      };
    }
  }
}

// Use as the last pipe in your route
new Route(EMethod.GET, "/data")
  .addPipe(fetchDataPipe)
  .addPipe(processDataPipe)
  .addPipe(errorHandlerPipe);
```

## Migration Guide

### From v0.5.x to v0.6.x

**Deprecated Presets:**
- `preset/health` → Use `plugins/healthcheck`
- `preset/status` → Use `plugins/status`

**New Features:**
- Added `plugins/access-log` for request logging
- Added `plugins/add-route` for route registration logging
- Improved event system

### From v0.6.x to v0.7.x (Planned)

**Breaking Changes:**
- `KeyMatch` constructor signature may change
- Error handling middleware pattern may be introduced

**New Features:**
- Planned middleware system
- Improved TypeScript types
- Better plugin architecture

## Advanced Patterns

### Conditional Route Registration

```typescript
function registerRoutes(api: Api, config: AppConfig) {
  // Always register public routes
  api.addRoute(publicRoute);
  
  // Conditionally register admin routes
  if (config.enableAdmin) {
    api.addRoute(adminRoute1);
    api.addRoute(adminRoute2);
  }
  
  // Environment-specific routes
  if (config.environment === "development") {
    api.addRoute(debugRoute);
  }
}
```

### Dynamic Route Generation

```typescript
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

### Request Context Decorator Pattern

```typescript
function withUser(context: IContext) {
  // Extract user from JWT or session
  const authHeader = context.request.headers.get("Authorization");
  
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const user = verifyJwt(token);
      context.state.set("user", user);
    } catch (error) {
      // Invalid token - clear any existing user
      context.state.set("user", null);
    }
  }
}

// Use as early pipe in your routes
new Route(EMethod.GET, "/profile")
  .addPipe(withUser) // Adds user to context.state
  .addPipe(async ({ response, state }) => {
    const user = state.get("user");
    
    if (!user) {
      throw new AccessDeniedError("Not authenticated");
    }
    
    response.body = { profile: user };
  });
```

## Performance Considerations

### Pipe Optimization

1. **Order matters**: Put simple, fast pipes first
2. **Avoid heavy operations in early pipes**: Database calls should come after validation
3. **Use async wisely**: Only make pipes async if they need to be
4. **Cache expensive operations**: Use state to cache results between pipes

### Memory Management

1. **Clean up state**: Remove large objects from state when no longer needed
2. **Stream large responses**: For file downloads, use streaming
3. **Avoid global state**: Use context.state instead of global variables

### Server Configuration

1. **Use appropriate port**: Avoid ports below 1024 (require root)
2. **Set proper hostname**: Use "0.0.0.0" for Docker containers
3. **Handle signals**: Implement graceful shutdown

## Troubleshooting

### Common Issues

**"Route not found" errors:**
- Check your route definitions and URL patterns
- Verify the HTTP method matches
- Ensure routes are added before calling `api.listen()`

**CORS issues:**
- Add CORS headers in a global pipe
- Consider using a CORS plugin

**Memory leaks:**
- Check for event listeners that aren't cleaned up
- Review state usage in long-running pipes
- Ensure database connections are closed

### Debugging

**Enable debug logging:**
```typescript
// Add this early in your setup
addEventListener(EEvent.BEFORE_REQUEST, (event) => {
  if (event instanceof RequestEvent) {
    console.debug(`${event.request.method} ${event.request.url}`);
  }
});

addEventListener(EEvent.ROUTE_ERROR, (event) => {
  if (event instanceof ErrorEvent) {
    console.error("Route error:", event.error);
  }
});
```

**Inspect context in pipes:**
```typescript
function debugPipe(context: IContext) {
  console.log({
    method: context.request.method,
    url: context.request.url,
    state: Object.fromEntries(context.state.entries()),
    match: context.match
  });
}
```

## API Reference

### Interfaces

**`IContext`**
```typescript
interface IContext {
  request: Request;
  response: IResponse;
  state: IState;
  match: IMatchResult;
  di: Record<string, any>;
  url: URL;
}
```

**`IResponse`**
```typescript
interface IResponse {
  status: number;
  headers: Headers;
  body: any;
  [key: string]: any;
}
```

**`IState`**
```typescript
interface IState {
  get(key: string): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  entries(): IterableIterator<[string, any]>;
}
```

**`IMatchResult`**
```typescript
interface IMatchResult {
  params: Record<string, any>;
  [key: string]: any;
}
```

### Enums

**`EMethod`**
```typescript
enum EMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS"
}
```

**`EEvent`**
```typescript
enum EEvent {
  API_ADD_ROUTE = "API_ADD_ROUTE",
  BEFORE_REQUEST = "BEFORE_REQUEST",
  BEFORE_ROUTE = "BEFORE_ROUTE",
  AFTER_ROUTE = "AFTER_ROUTE",
  ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
  ROUTE_ERROR = "ROUTE_ERROR",
  CRITICAL_ERROR = "CRITICAL_ERROR"
}
```

## Additional Resources

- [Deno Documentation](https://deno.land/manual)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [URLPattern MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
- [GitHub Repository](https://github.com/dareksob/deno-api-server)

## Contributing to Documentation

Found an error or want to improve the docs? 

1. Fork the repository
2. Make your changes to the documentation files
3. Submit a pull request
4. Follow the existing style and structure

Documentation files are in Markdown format and should:
- Use consistent heading levels
- Include code examples where helpful
- Be clear and concise
- Follow the existing organization pattern