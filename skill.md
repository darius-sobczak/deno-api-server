# deno-api-server Skill Documentation

## Overview

`deno-api-server` is an HTTP/REST API framework for Deno built on top of the standard `std/http` library. It uses a functional pipe-based architecture where each route consists of a chain of pipes (middleware-like functions) that process requests sequentially.

### Key Concepts

- **Routes**: Define endpoint paths and HTTP methods
- **Pipes**: Functions that process requests in sequence
- **Context**: Shared object passed through pipe chain containing request, response, state, and DI
- **Matchers**: Determine if a route matches a URL, with support for typed parameters
- **Dependency Injection**: Services can be injected into routes for testing and modularity

### Import

```typescript
import { Api, Route, EMethod } from "https://deno.land/x/deno_api_server/mod.ts";
```

---

## Quick Start

### Minimal Server

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 8080 });

api.addRoute(
  new Route(EMethod.GET, "/")
    .addPipe(({ response }) => {
      response.body = { message: "Hello API" };
    })
);

console.log(`Start server localhost:${api.serverConfig.port}`);
await api.listen();
```

### Run the Server

```bash
deno run --allow-net main.ts
```

---

## Class Overview

### Core Classes

| Class | File | Description | Status |
|-------|------|-------------|--------|
| `Api` | `src/services/api.ts` | Core HTTP server class that manages routes and handles requests | Active |
| `Route` | `src/services/route.ts` | Route definition with pipe chain, matcher, and dependency injection | Active |
| `PatternMatch` | `src/services/matcher/pattern-match.ts` | URLPattern-based matcher for routes | Active |
| `KeyMatch` | `src/services/matcher/key-match.ts` | Parameterized URI matcher with type transformation | Active |
| `UriMatch` | `src/services/matcher/uri-match.ts` | Simple exact string URI matcher | Active |

### Error Classes

| Class | File | Description | Status |
|-------|------|-------------|--------|
| `RequestError` | `src/errors/request.error.ts` | Base error class with HTTP status code | Active |
| `BadRequestError` | `src/errors/bad-request.error.ts` | 400 Bad Request error | Active |
| `AccessDeniedError` | `src/errors/access-denied.error.ts` | 403 Forbidden error | Active |
| `NotFoundError` | `src/errors/not-found.error.ts` | 404 Not Found error | Active |
| `IllegalArgumentError` | `src/errors/illegal-argument.error.ts` | Argument validation error | Active |

### Testing Classes

| Class | File | Description | Status |
|-------|------|-------------|--------|
| `MockApi` | `src/testing/mock-api.ts` | Test-friendly API wrapper for unit testing | Active |
| `mockRequest` | `src/testing/mock-request.ts` | Creates mock Request object | Active |
| `mockResponse` | `src/testing/mock-response.ts` | Creates mock IResponse object | Active |
| `mockContext` | `src/testing/mock-context.ts` | Creates full IContext for pipe testing | Active |
| `mockFn` | `src/testing/mock-fn.ts` | Creates mock function with call tracking | Active |

### Enums & Constants

| Enum/Const | File | Description | Status |
|------------|------|-------------|--------|
| `EMethod` | `src/definition/method.ts` | HTTP method constants (GET, POST, etc.) | Active |
| `EEvent` | `src/definition/event.ts` | Event type constants for lifecycle events | Active |
| `EPatternTypes` | `src/definition/pattern-map.ts` | Parameter type constants for KeyMatch | Active |
| `BreakPipe` | `src/definition/types.ts` | Symbol to stop pipe execution early | Active |

### Deprecated Features

| Feature | Replacement | Deprecated In |
|---------|-------------|--------------|
| `preset/health` | Use `plugins/healthcheck` | v0.6.0 |
| `preset/status` | Use `plugins/status` | v0.6.0 |

---

## Core Concepts

### Routes and Methods

Define routes with HTTP methods using the `EMethod` enum:

```typescript
// Single method
new Route(EMethod.GET, "/users")

// Multiple methods
new Route([EMethod.GET, EMethod.POST], "/users")

// Any method (custom array)
new Route(["GET", "POST", "PUT", "DELETE"], "/resource")
```

### Pipes

Pipes are functions that process requests. They receive a context object and can modify the response or pass data via state:

```typescript
const myPipe = ({ request, response, state, di, match }: IContext) => {
  // Read request data
  const body = state.get("body");
  
  // Modify response
  response.status = 200;
  response.body = { success: true };
  
  // Pass data to next pipe
  state.set("processed", true);
};
```

Add pipes to routes using chaining:

```typescript
new Route(EMethod.GET, "/api")
  .addPipe(validationPipe)
  .addPipe(authPipe)
  .addPipe(handlerPipe);
```

### BreakPipe

Use `BreakPipe` to stop the pipe chain early (useful for redirects or early returns):

```typescript
import { BreakPipe } from "https://deno.land/x/deno_api_server/mod.ts";

new Route(EMethod.GET, "/redirect")
  .addPipe(() => {
    return BreakPipe; // Stops execution
  })
  .addPipe(({ response }) => {
    // This pipe will NOT execute
    response.body = { never: "reached" };
  });
```

### Matchers

#### String Matcher (Default)

```typescript
// Automatically creates PatternMatch
new Route(EMethod.GET, "/users")
```

#### URLPattern Matcher

```typescript
new Route(
  EMethod.GET,
  new URLPattern({ pathname: "/users/:id" })
)
```

#### KeyMatch for Typed Parameters

```typescript
new Route(
  EMethod.GET,
  new KeyMatch("/users/:id/:name", {
    id: { type: "number" },    // Converts to number
    name: {}                    // Default: any string
  })
)
```

### Dependency Injection

Inject services into routes for loose coupling and testability:

```typescript
const route = new Route(EMethod.GET, "/data")
  .inject("db", databaseService)
  .addPipe(async ({ di, response }) => {
    const data = await di.db.query("SELECT * FROM users");
    response.body = { users: data };
  });
```

Bulk injection:

```typescript
const route = new Route(EMethod.GET, "/data")
  .injections({
    db: databaseService,
    logger: loggerService,
    auth: authService
  })
  .addPipe(handlerPipe);
```

### State Management

Pass data between pipes using the state Map:

```typescript
new Route(EMethod.GET, "/chained")
  .addPipe(({ state }) => {
    state.set("step1", "completed");
  })
  .addPipe(({ state, response }) => {
    const previous = state.get("step1");
    response.body = { previousStep: previous };
  });
```

---

## Complex Use Cases

### URL Parameters with KeyMatch

#### Basic Parameter Extraction

```typescript
new Route(
  EMethod.GET,
  new KeyMatch("/users/:id", {
    id: {}
  })
)
.addPipe(({ match, response }) => {
  response.body = { userId: match.params.get("id") };
});
```

#### Type Transformation

```typescript
new Route(
  EMethod.GET,
  new KeyMatch("/users/:id", {
    id: { type: "number" }  // Converts "123" to 123
  })
)
.addPipe(({ match, response }) => {
  // match.params.get("id") is now a number
  response.body = { userId: match.params.get("id"), type: typeof match.params.get("id") };
});
```

#### Available Types (EPatternTypes)

| Type | Description | Example Match |
|------|-------------|---------------|
| `ANY` | Alphanumeric, dots, dashes, underscores | "user-123", "test.name" |
| `NUMBER` | Float or integer | "123", "45.67" |
| `INT` | Integer only | "123" |
| `ALPHA` | Letters only | "abc" |
| `HASH` | Alphanumeric only | "abc123" |
| `REST` | Remaining path | "a/b/c" |

#### Custom Patterns

```typescript
new Route(
  EMethod.GET,
  new KeyMatch("/verify/:code", {
    code: {
      describe: {
        pattern: "[A-Z0-9]{6}",
        transform: (v) => v.toUpperCase()
      }
    }
  })
)
```

#### Rest Parameters

```typescript
new Route(
  EMethod.GET,
  new KeyMatch("/files/:path", {
    path: { type: "rest" }
  })
)
// Matches: /files/a/b/c.txt
// params.get("path") = "a/b/c.txt"
```

### Event System

Subscribe to lifecycle events using standard DOM-style event listeners:

```typescript
import { EEvent } from "https://deno.land/x/deno_api_server/mod.ts";
import RouteEvent from "https://deno.land/x/deno_api_server/src/definition/events/route.event.ts";
import RequestEvent from "https://deno.land/x/deno_api_server/src/definition/events/request.event.ts";

// Before route is added
addEventListener(EEvent.API_ADD_ROUTE, (event) => {
  if (event instanceof RouteEvent) {
    console.log(`Registered: ${event.route.methods} ${event.route.matcher.uri}`);
  }
});

// Before route executes
addEventListener(EEvent.BEFORE_ROUTE, (event) => {
  if (event instanceof RouteEvent) {
    console.log(`Executing: ${event.route.matcher.uri}`);
  }
});

// After response is sent
addEventListener(EEvent.AFTER_ROUTE_RESPONSE, (event) => {
  if (event instanceof RequestEvent) {
    console.log(`Response: ${event.response.status}`);
  }
});

// Route not found (404)
addEventListener(EEvent.ROUTE_NOT_FOUND, (event) => {
  if (event instanceof RequestEvent) {
    console.log(`404: ${event.request.url}`);
  }
});

// Route threw an error
addEventListener(EEvent.ROUTE_ERROR, (event) => {
  console.log(`Error: ${event.error.message}`);
});
```

### Error Handling

#### Throwing Errors

```typescript
new Route(EMethod.GET, "/error")
  .addPipe(() => {
    throw new RequestError("Something went wrong", 400);
  });

// Or use typed errors
new Route(EMethod.GET, "/forbidden")
  .addPipe(() => {
    throw new AccessDeniedError("Admin access required");
  });

new Route(EMethod.GET, "/not-found")
  .addPipe(() => {
    throw new NotFoundError("User not found");
  });

new Route(EMethod.POST, "/invalid")
  .addPipe(() => {
    throw new BadRequestError("Invalid email format");
  });
```

#### Error Response Format

By default, errors return JSON:
```json
{ "message": "Error description" }
```

Set `forceJsonResponse = false` on Api for plain text errors:
```typescript
const api = new Api({ port: 8080 });
api.forceJsonResponse = false;
```

### Static Files

```typescript
import filePipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/file.pipe.ts";

new Route(EMethod.GET, "/files/:path")
  .addPipe(filePipe("./public/:path"));
```

#### FilePipe Options

```typescript
filePipe("./file.txt", {
  contentType: "text/plain",     // Force content type
  noThrow: true,                  // Don't throw on missing file
  continue: true,                 // Continue to next pipe after serving
  statusCode: 200,                // Override status code
  cacheControl: 3600             // Cache for 1 hour
});
```

### HTML Responses

```typescript
import htmlPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/html.pipe.ts";

new Route(EMethod.GET, "/page")
  .addPipe(htmlPipe("<h1>Hello World</h1>"));
```

---

## Testing Integration

### Import Testing Utilities

```typescript
import { mockApi, mockRequest, mockResponse, mockContext, mockFn } from "https://deno.land/x/deno_api_server/dev_mod.ts";
```

### Testing Routes Directly

```typescript
Deno.test("Route returns 200", async () => {
  const route = new Route(EMethod.GET, "/hello")
    .addPipe(({ response }) => {
      response.body = { message: "Hello" };
    });

  const url = new URL("/hello", "http://localhost");
  const request = mockRequest("GET", "/hello");
  const response = mockResponse();

  const context = await route.execute(url, request, response);

  assertEquals(context.response.status, 200);
  assertEquals(context.response.body, { message: "Hello" });
});
```

### Using MockApi

```typescript
Deno.test("API handles request", async () => {
  const route = new Route(EMethod.GET, "/hello")
    .addPipe(({ response }) => {
      response.body = { message: "Hello" };
    });

  const api = mockApi(route);
  await api.sendByArguments("GET", "/hello");

  assertEquals(api.lastRoute === route, true);
  assertEquals(api.lastContext?.response.status, 200);
});
```

### Testing with Request Data

```typescript
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

Deno.test("POST with JSON body", async () => {
  const route = new Route(EMethod.POST, "/submit")
    .addPipe(jsonBodyPipe)
    .addPipe(({ state, response }) => {
      response.body = { received: state.get("body") };
    });

  const api = mockApi(route);

  const request = mockRequest("POST", "/submit", { name: "John" });
  await api.sendByRequest(request);

  assertEquals(api.lastContext?.response.status, 201);
  assertEquals(api.lastContext?.response.body, { received: { name: "John" } });
});
```

### Mocking Dependency Injection

```typescript
Deno.test("Mock database service", async () => {
  const route = new Route(EMethod.GET, "/users")
    .injections({
      db: {
        getUsers() {
          return ["user1", "user2"];
        }
      }
    })
    .addPipe(({ di, response }) => {
      response.body = { users: di.db.getUsers() };
    });

  const api = mockApi(route);

  // Use real implementation
  await api.sendByArguments("GET", "/users");
  assertEquals(api.lastContext?.response.body, { users: ["user1", "user2"] });

  // Mock implementation
  api.mockInjections({
    db: {
      getUsers() {
        return ["mocked1", "mocked2"];
      }
    }
  });

  await api.sendByArguments("GET", "/users");
  assertEquals(api.lastContext?.response.body, { users: ["mocked1", "mocked2"] });
});
```

### Using mockFn

```typescript
Deno.test("Track function calls", async () => {
  const myFn = mockFn();

  const route = new Route(EMethod.GET, "/test")
    .addPipe(() => {
      myFn("hello", 123);
    });

  const api = mockApi(route);
  await api.sendByArguments("GET", "/test");

  // Assert call count
  assertEquals(myFn.mock.calls.length, 1);

  // Assert call arguments
  assertEquals(myFn.mock.calls[0], ["hello", 123]);
});
```

### Testing Pipes Directly

```typescript
Deno.test("Custom pipe adds header", async () => {
  const myPipe = ({ response }: IContext) => {
    response.headers.set("X-Custom", "value");
  };

  const context = mockContext({});
  await myPipe(context);

  assertEquals(context.response.headers.get("X-Custom"), "value");
});
```

### Testing Error Handling

```typescript
Deno.test("Route throws RequestError", async () => {
  const route = new Route(EMethod.GET, "/error")
    .addPipe(() => {
      throw new RequestError("Bad request", 400);
    });

  const api = mockApi(route);
  await api.sendByArguments("GET", "/error");

  assertEquals(api.lastContext?.response.status, 400);
});
```

---

## Built-in Presets

### Body Parsing

#### jsonBodyPipe

Parses JSON request body and stores in `state.body`:

```typescript
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

new Route(EMethod.POST, "/api")
  .addPipe(jsonBodyPipe)
  .addPipe(({ state, response }) => {
    const body = state.get("body");     // Parsed JSON
    const bodyType = state.get("bodyType"); // "json"
  });
```

#### rawBodyPipe

Reads raw body as string:

```typescript
import rawBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/raw-body.pipe.ts";

new Route(EMethod.POST, "/api")
  .addPipe(rawBodyPipe)
  .addPipe(({ state }) => {
    const body = state.get("body");     // String
    const bodyType = state.get("bodyType"); // "raw"
  });
```

### Processing

#### redirectPipe

HTTP redirect (302 by default):

```typescript
import redirectPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/redirect.pipe.ts";

// Static redirect
new Route(EMethod.GET, "/old")
  .addPipe(redirectPipe("/new"));

// Custom status
new Route(EMethod.GET, "/moved")
  .addPipe(redirectPipe("/new", 301));

// Dynamic redirect
new Route(EMethod.GET, "/redirect")
  .addPipe(({ url }) => {
    return redirectPipe(`/target?id=${url.searchParams.get("id")}`);
  });
```

#### filePipe

Serve static files:

```typescript
import filePipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/file.pipe.ts";

new Route(EMethod.GET, "/files/:name")
  .addPipe(filePipe("./public/:name"));
```

#### htmlPipe

Serve HTML content:

```typescript
import htmlPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/html.pipe.ts";

new Route(EMethod.GET, "/page")
  .addPipe(htmlPipe("<html><body>Hello</body></html>"));
```

---

## Plugins

### Swagger/OpenAPI

Generate OpenAPI 3.0 specification:

```typescript
import swaggerPlugin from "https://deno.land/x/deno_api_server/plugins/swagger/plugin.ts";

swaggerPlugin(api, {
  info: {
    title: "My API",
    description: "API documentation",
    version: "1.0.0"
  },
  servers: [{ url: "http://localhost:8080" }]
});
```

Access at `/swagger.json` by default.

### Health Check

Simple health endpoint:

```typescript
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";

healthcheckPlugin(api);
// Adds GET/HEAD /healthz endpoint
```

### Status

Server status endpoint:

```typescript
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";

statusPlugin(api);
// Adds /status endpoint with server info
```

### Access Log

Log all requests:

```typescript
import accessLogPlugin from "https://deno.land/x/deno_api_server/plugins/access-log/plugin.ts";

accessLogPlugin(api, {
  log: (req, res) => console.log(`${req.method} ${req.url} ${res.status}`)
});
```

### Add Route

Log route registrations:

```typescript
import addRoutePlugin from "https://deno.land/x/deno_api_server/plugins/add-route/plugin.ts";

addRoutePlugin(api, {
  log: (route) => console.log(`Registered: ${route.methods} ${route.matcher.uri}`)
});
```

---

## API Reference

### Api Class

| Method | Description |
|--------|-------------|
| `constructor(config: IServerConfig)` | Create API server instance |
| `addRoute(route: IRoute): this` | Add route to server |
| `listen(): Promise<void>` | Start HTTP server |
| `getRouteByRequest(request: Request, url?: URL): IRoute | null` | Find matching route |

### Api Properties

| Property | Type | Description |
|----------|------|-------------|
| `routes` | `IRoute[]` | Registered routes |
| `serverConfig` | `IServerConfig` | Server configuration |
| `forceJsonResponse` | `boolean` | Force JSON error responses (default: true) |
| `props` | `IStateMap` | Server-level state map |

### Route Class

| Method | Description |
|--------|-------------|
| `constructor(method: string[] | string, uri: IMatcher | URLPattern | string)` | Create route |
| `addPipe(pipe: IPipe): IRoute` | Add pipe to chain |
| `inject(name: string, service: any, overridable?: boolean): this` | Inject service |
| `injections(di: IInjections): this` | Bulk inject services |
| `prop(name: string, value: any): this` | Set route property |
| `execute(url: URL, request: IRequest, response: IResponse): Promise<IContext>` | Execute route |

### Route Properties

| Property | Type | Description |
|----------|------|-------------|
| `methods` | `string[]` | HTTP methods |
| `matcher` | `IMatcher` | URL matcher |
| `di` | `IInjections` | Injected services |
| `props` | `IStateMap` | Route properties |

### Context (IContext)

| Property | Type | Description |
|----------|------|-------------|
| `route` | `IRoute` | Current route |
| `di` | `IInjections` | Injected services |
| `match` | `IMatch` | URL match result |
| `url` | `URL` | Request URL |
| `request` | `IRequest` | Request object |
| `response` | `IResponse` | Response object |
| `state` | `IStateMap` | Pipe-to-pipe state |

---

## Best Practices

### 1. Keep Pipes Small and Focused

Each pipe should do one thing well. This makes testing and reuse easier.

### 2. Use Events for Cross-Cutting Concerns

Instead of adding logging/auth to every route, use event listeners:

```typescript
addEventListener(EEvent.BEFORE_ROUTE, (event) => {
  // Auth check, logging, etc.
});
```

### 3. Mock Dependencies in Tests

Use `mockInjections` to replace real services with mocks:

```typescript
api.mockInjections({
  db: mockDatabase,
  logger: mockLogger
});
```

### 4. Use Proper Error Types

Throw `RequestError` or its subclasses instead of generic Errors for proper HTTP status codes.

### 5. Leverage TypeScript

Use the type definitions from `mod.ts`:

```typescript
import { IContext, IRoute, IPipe } from "https://deno.land/x/deno_api_server/mod.ts";
```

### 6. Use State for Intermediate Data

Pass data between pipes using `state` rather than closures:

```typescript
route
  .addPipe(pipe1)
  .addPipe(pipe2)  // Can access data from pipe1
```

---

## File Structure Reference

```
deno-api-server/
├── mod.ts                    # Main exports
├── dev_mod.ts               # Testing utilities exports
├── src/
│   ├── definition/
│   │   ├── types.ts         # Core interfaces (IContext, IRoute, etc.)
│   │   ├── event.ts        # Event constants (EEvent)
│   │   ├── method.ts       # HTTP method constants (EMethod)
│   │   └── pattern-map.ts  # Parameter type patterns
│   ├── services/
│   │   ├── api.ts          # Api server class
│   │   ├── route.ts        # Route class
│   │   └── matcher/
│   │       ├── pattern-match.ts  # URLPattern matcher
│   │       ├── key-match.ts      # Parameterized matcher
│   │       └── uri-match.ts      # Simple string matcher
│   ├── errors/
│   │   ├── request.error.ts
│   │   ├── bad-request.error.ts
│   │   ├── access-denied.error.ts
│   │   └── not-found.error.ts
│   ├── presets/
│   │   └── pipes/
│   │       ├── body/
│   │       └── process/
│   └── testing/
│       ├── mock-api.ts
│       ├── mock-request.ts
│       ├── mock-response.ts
│       ├── mock-context.ts
│       └── mock-fn.ts
└── plugins/
    ├── swagger/
    ├── healthcheck/
    ├── status/
    ├── access-log/
    └── add-route/
```

---

## Migration from Deprecated Features

### Health Check

**Before (deprecated):**
```typescript
import healthzRoute from "https://deno.land/x/deno_api_server/src/presets/routes/healthz.ts";
api.addRoute(healthzRoute);
```

**After:**
```typescript
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";
healthcheckPlugin(api);
```

### Status Endpoint

**Before (deprecated):**
```typescript
import statusRoute from "https://deno.land/x/deno_api_server/src/presets/routes/status.ts";
api.addRoute(statusRoute);
```

**After:**
```typescript
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";
statusPlugin(api);
```
