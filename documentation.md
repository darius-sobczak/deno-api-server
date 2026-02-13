# deno-api-server Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Architecture Overview](#architecture-overview)
5. [Core Concepts](#core-concepts)
6. [API Reference](#api-reference)
7. [Routing](#routing)
8. [Pipes](#pipes)
9. [Matchers](#matchers)
10. [Dependency Injection](#dependency-injection)
11. [State Management](#state-management)
12. [Events](#events)
13. [Error Handling](#error-handling)
14. [Testing](#testing)
15. [Built-in Presets](#built-in-presets)
16. [Plugins](#plugins)
17. [Examples](#examples)
18. [Best Practices](#best-practices)
19. [Migration Guide](#migration-guide)
20. [Troubleshooting](#troubleshooting)

---

## Introduction

`deno-api-server` is a modern HTTP/REST API framework for Deno built on top of the standard `std/http` library. It follows a functional programming paradigm using a pipe-based architecture where each route consists of a chain of middleware-like functions called "pipes" that process requests sequentially.

### Key Features

- **Pipe-based Architecture**: Modular, composable request handlers
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Flexible Matching**: Support for simple strings, URLPattern, and typed parameters
- **Dependency Injection**: Built-in DI system for testable code
- **Event System**: Lifecycle events for extensibility
- **Testing Utilities**: Built-in mocks for unit testing
- **Plugin System**: Swappable middleware for common functionality

### Philosophy

The framework emphasizes:
- **Simplicity**: Minimal boilerplate to get started
- **Modularity**: Small, reusable pipes
- **Testability**: First-class testing support
- **Type Safety**: Full TypeScript integration

---

## Installation

### Import from Deno Land

```typescript
import { Api, Route, EMethod } from "https://deno.land/x/deno_api_server/mod.ts";
```

### Import Testing Utilities

```typescript
import { mockApi, mockRequest, mockResponse, mockContext, mockFn } from "https://deno.land/x/deno_api_server/dev_mod.ts";
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

### Add Multiple Routes

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 8080 });

// GET endpoint
api.addRoute(
  new Route(EMethod.GET, "/users")
    .addPipe(({ response }) => {
      response.body = { users: [] };
    })
);

// POST endpoint
api.addRoute(
  new Route(EMethod.POST, "/users")
    .addPipe(({ response }) => {
      response.status = 201;
      response.body = { created: true };
    })
);

await api.listen();
```

---

## Architecture Overview

### Request Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│           Api Server                  │
│  ┌────────────────────────────────┐ │
│  │   Route Matching (matcher)      │ │
│  └────────────────────────────────┘ │
└──────┬──────────────────────────────┘
       │
       ▼ (if matched)
┌──────────────────────────────────────┐
│         Pipe Chain                   │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ Pipe │→│ Pipe │→│ Pipe │→ ...    │
│  └──────┘ └──────┘ └──────┘         │
│         ↓ (BreakPipe stops)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

### Core Components

| Component | Description |
|-----------|-------------|
| `Api` | HTTP server that manages routes and handles requests |
| `Route` | Endpoint definition with matcher and pipe chain |
| `Pipe` | Function that processes request/response |
| `Matcher` | Determines if a route matches a URL |
| `Context` | Shared object passed through pipe chain |

---

## Core Concepts

### The Context Object

Every pipe receives a context object containing all necessary information:

```typescript
interface IContext {
  route: IRoute;           // Current route
  di: IInjections;         // Injected services
  match: IMatch;           // URL match result
  url: URL;                // Request URL
  request: IRequest;       // Request object
  response: IResponse;     // Response object (modify this)
  state: IStateMap;        // Pipe-to-pipe state
}
```

Example usage:

```typescript
const myPipe = ({ request, response, state, di, match, url }: IContext) => {
  // Access request data
  const method = request.method;
  const headers = request.headers;
  
  // Access URL parameters
  const userId = match.params.get("id");
  
  // Read/write state
  state.set("startTime", Date.now());
  
  // Access injected services
  const db = di.database;
  
  // Modify response
  response.status = 200;
  response.body = { success: true };
};
```

---

## API Reference

### Api Class

The main server class that handles HTTP requests.

#### Constructor

```typescript
constructor(config: IServerConfig)
```

```typescript
interface IServerConfig {
  hostname?: string;  // Default: "localhost"
  https?: boolean;   // Default: false
  port: number;      // Required
}
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `addRoute(route: IRoute)` | Add a route to the server | `this` (chainable) |
| `listen()` | Start the HTTP server | `Promise<void>` |
| `getRouteByRequest(request: Request, url?: URL)` | Find matching route | `IRoute \| null` |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `routes` | `IRoute[]` | All registered routes |
| `serverConfig` | `IServerConfig` | Server configuration |
| `forceJsonResponse` | `boolean` | Force JSON error responses (default: true) |
| `props` | `IStateMap` | Server-level state |
| `host` | `string` | Full host URL (computed) |

#### Example

```typescript
const api = new Api({ port: 8080, hostname: "0.0.0.0" });

api.addRoute(new Route(EMethod.GET, "/health").addPipe(({ response }) => {
  response.body = { status: "ok" };
}));

// Use chaining
api
  .addRoute(route1)
  .addRoute(route2)
  .addRoute(route3);

await api.listen();
```

---

### Route Class

Defines an endpoint with HTTP methods, matcher, and pipe chain.

#### Constructor

```typescript
constructor(method: string[] | string, uri: IMatcher | URLPattern | string)
```

```typescript
// Single method
new Route(EMethod.GET, "/users")

// Multiple methods
new Route([EMethod.GET, EMethod.POST], "/users")

// Custom methods
new Route(["GET", "POST", "PUT", "DELETE"], "/resource")

// With matcher
new Route(EMethod.GET, new KeyMatch("/users/:id", { id: { type: "number" } }))

// With URLPattern
new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `addPipe(pipe: IPipe)` | Add a pipe to the chain | `IRoute` (chainable) |
| `inject(name: string, service: any, overridable?: boolean)` | Inject a service | `this` (chainable) |
| `injections(di: IInjections)` | Bulk inject services | `this` (chainable) |
| `prop(name: string, value: any)` | Set a route property | `this` (chainable) |
| `execute(url: URL, request: IRequest, response: IResponse)` | Execute the pipe chain | `Promise<IContext>` |
| `isMatch(url: URL)` | Check if route matches URL | `boolean` |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `methods` | `string[]` | HTTP methods (uppercase) |
| `matcher` | `IMatcher` | URL matcher |
| `di` | `IInjections` | Injected services |
| `props` | `IStateMap` | Route properties |
| `parent` | `Api \| undefined` | Parent API instance |

#### Example

```typescript
const route = new Route(EMethod.POST, "/users/:id")
  .inject("db", databaseService)
  .prop("description", "User CRUD operations")
  .addPipe(validationPipe)
  .addPipe(authPipe)
  .addPipe(handlerPipe);
```

---

### Pipe Functions

A pipe is a function that processes the request:

```typescript
type IPipe = (context: IContext) => void;
```

Pipes can be synchronous or asynchronous:

```typescript
// Synchronous pipe
const pipe1 = ({ response }) => {
  response.body = { message: "Hello" };
};

// Asynchronous pipe
const pipe2 = async ({ di, response }) => {
  const data = await di.db.query("SELECT * FROM users");
  response.body = { users: data };
};

// Pipe that returns BreakPipe
const redirectPipe = () => {
  return BreakPipe;
};
```

---

## Routing

### HTTP Methods

Use the `EMethod` enum for type-safe HTTP methods:

```typescript
import { EMethod } from "https://deno.land/x/deno_api_server/mod.ts";

EMethod.GET
EMethod.POST
EMethod.PUT
EMethod.PATCH
EMethod.DELETE
EMethod.HEAD
EMethod.OPTIONS
```

### Route Matching

Routes are matched in registration order. The first matching route handles the request.

```typescript
// More specific routes should come first
api.addRoute(new Route(EMethod.GET, "/users/:id"));  // Specific
api.addRoute(new Route(EMethod.GET, "/users"));       // General
```

### Multiple Methods

```typescript
// Single route handles multiple methods
new Route([EMethod.GET, EMethod.POST], "/resource")
  .addPipe(({ request, response }) => {
    response.body = { method: request.method };
  });
```

---

## Pipes

### Pipe Chains

Pipes execute in order. Each pipe can:

- Modify the response
- Add data to state
- Throw an error
- Return `BreakPipe` to stop execution

```typescript
new Route(EMethod.GET, "/api")
  .addPipe(authPipe)        // Executes first
  .addPipe(validationPipe)   // Executes second
  .addPipe(handlerPipe);    // Executes last
```

### BreakPipe

Use `BreakPipe` to stop the pipe chain early:

```typescript
import { BreakPipe } from "https://deno.land/x/deno_api_server/mod.ts";

new Route(EMethod.GET, "/redirect")
  .addPipe(() => {
    // This stops execution - subsequent pipes won't run
    return BreakPipe;
  })
  .addPipe(({ response }) => {
    // This never executes
    response.body = { never: "reached" };
  });
```

### Creating Reusable Pipes

```typescript
// Authentication pipe
const authPipe = ({ request, di, response }: IContext) => {
  const token = request.headers.get("Authorization");
  if (!token) {
    throw new AccessDeniedError("Missing token");
  }
  const user = di.auth.verify(token);
  di.user = user;
};

// Logging pipe
const loggingPipe = async ({ url, state }: IContext) => {
  const start = Date.now();
  state.set("log:start", start);
  // ... request continues
  console.log(`${url.pathname} took ${Date.now() - start}ms`);
};
```

---

## Matchers

Matchers determine if a route matches a URL request.

### String Matcher (Default)

The simplest form - exact string matching:

```typescript
new Route(EMethod.GET, "/users")
// Matches: /users
// Does not match: /users/, /users/123
```

### PatternMatch

Uses Deno's built-in `URLPattern`:

```typescript
new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
// Matches: /users/123
// params: { id: "123" }
```

### KeyMatch

Parameter-based matching with type transformation:

```typescript
new Route(
  EMethod.GET,
  new KeyMatch("/users/:id/:name", {
    id: { type: "number" },    // Transforms to number
    name: {}                    // String (default)
  })
)
```

### UriMatch

Exact path matching:

```typescript
new Route(EMethod.GET, new UriMatch("/exact/path"))
```

---

## Dependency Injection

### Basic Injection

```typescript
const route = new Route(EMethod.GET, "/data")
  .inject("db", databaseService)
  .addPipe(async ({ di, response }) => {
    const users = await di.db.getUsers();
    response.body = { users };
  });
```

### Bulk Injection

```typescript
const route = new Route(EMethod.GET, "/data")
  .injections({
    db: databaseService,
    cache: cacheService,
    logger: loggerService
  })
  .addPipe(handlerPipe);
```

### Overridable Services

```typescript
// Second parameter prevents override
route.inject("config", defaultConfig, false);

// Allow override (useful for testing)
route.inject("db", realDatabase, true);
```

### Injection in Tests

```typescript
// Create mock API
const api = mockApi(route);

// Override injections
api.mockInjections({
  db: mockDatabase,
  cache: mockCache
});
```

---

## State Management

The state object passes data between pipes:

```typescript
new Route(EMethod.GET, "/chained")
  .addPipe(({ state }) => {
    state.set("step1", "data from step 1");
  })
  .addPipe(({ state, response }) => {
    const step1Data = state.get("step1");
    response.body = { step1Data };
  });
```

### Use Cases

- Timing information across pipes
- Parsed request data
- Authentication results
- Cached data

---

## Events

The framework dispatches events at key points in the request lifecycle:

### Event Types

| Event | Description | Event Class |
|-------|-------------|-------------|
| `API_ADD_ROUTE` | Before route is added | `RouteEvent` |
| `BEFORE_ROUTE` | Before route executes | `RouteEvent` |
| `BEFORE_REQUEST` | Before route matching | `RequestEvent` |
| `AFTER_ROUTE_RESPONSE` | After response is sent | `RequestEvent` |
| `ROUTE_NOT_FOUND` | No matching route (404) | `RequestEvent` |
| `ROUTE_ERROR` | Route threw an error | `ErrorEvent` |
| `CRITICAL_ERROR` | Response construction failed | `ErrorEvent` |

### Listening to Events

```typescript
import { EEvent } from "https://deno.land/x/deno_api_server/mod.ts";
import RouteEvent from "https://deno.land/x/deno_api_server/src/definition/events/route.event.ts";
import RequestEvent from "https://deno.land/x/deno_api_server/src/definition/events/request.event.ts";

// Log all registered routes
addEventListener(EEvent.API_ADD_ROUTE, (event) => {
  if (event instanceof RouteEvent) {
    console.log(`Registered: ${event.route.methods} ${event.route.matcher.uri}`);
  }
});

// Authentication check
addEventListener(EEvent.BEFORE_ROUTE, (event) => {
  if (event instanceof RouteEvent) {
    const route = event.route;
    // Check if route requires auth
  }
});

// After response
addEventListener(EEvent.AFTER_ROUTE_RESPONSE, (event) => {
  if (event instanceof RequestEvent) {
    console.log(`${event.request.method} ${event.request.url} → ${event.response.status}`);
  }
});
```

---

## Error Handling

### Throwing Errors

```typescript
import { RequestError, AccessDeniedError, NotFoundError, BadRequestError } from "https://deno.land/x/deno_api_server/mod.ts";

new Route(EMethod.GET, "/error")
  .addPipe(() => {
    throw new RequestError("Something went wrong", 400);
  });

// Pre-defined error types
new Route(EMethod.GET, "/forbidden")
  .addPipe(() => {
    throw new AccessDeniedError();
  });

new Route(EMethod.GET, "/not-found")
  .addPipe(() => {
    throw new NotFoundError("Resource not found");
  });

new Route(EMethod.POST, "/bad-request")
  .addPipe(() => {
    throw new BadRequestError("Invalid input");
  });
```

### Error Response Format

By default, errors return JSON:

```json
{ "message": "Error description" }
```

Disable JSON responses:

```typescript
const api = new Api({ port: 8080 });
api.forceJsonResponse = false;
```

### Global Error Handling

```typescript
addEventListener(EEvent.ROUTE_ERROR, (event) => {
  console.error(`Route error: ${event.error.message}`);
});
```

---

## Testing

### Testing Utilities

Import from `dev_mod.ts`:

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

  assertEquals(api.lastRoute === route);
  assertEquals(api.lastContext?.response.status, 200);
});
```

### Testing with Request Data

```typescript
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

### Mocking Dependencies

```typescript
Deno.test("Mock database", async () => {
  const route = new Route(EMethod.GET, "/users")
    .injections({
      db: { getUsers: () => ["user1", "user2"] }
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
    db: { getUsers: () => ["mock1", "mock2"] }
  });

  await api.sendByArguments("GET", "/users");
  assertEquals(api.lastContext?.response.body, { users: ["mock1", "mock2"] });
});
```

### Using mockFn

```typescript
Deno.test("Track function calls", async () => {
  const myFn = mockFn();

  const route = new Route(EMethod.GET, "/test")
    .addPipe(() => myFn("hello", 123));

  const api = mockApi(route);
  await api.sendByArguments("GET", "/test");

  assertEquals(myFn.mock.calls.length, 1);
  assertEquals(myFn.mock.calls[0], ["hello", 123]);
});
```

### Testing Pipes Directly

```typescript
Deno.test("Pipe adds header", async () => {
  const myPipe = ({ response }: IContext) => {
    response.headers.set("X-Custom", "value");
  };

  const context = mockContext({});
  await myPipe(context);

  assertEquals(context.response.headers.get("X-Custom"), "value");
});
```

---

## Built-in Presets

### Body Parsing

#### jsonBodyPipe

Parse JSON request body:

```typescript
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

new Route(EMethod.POST, "/api")
  .addPipe(jsonBodyPipe)
  .addPipe(({ state, response }) => {
    const body = state.get("body");
    const bodyType = state.get("bodyType"); // "json"
    response.body = { received: body };
  });
```

#### rawBodyPipe

Read raw body as string:

```typescript
import rawBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/raw-body.pipe.ts";

new Route(EMethod.POST, "/api")
  .addPipe(rawBodyPipe)
  .addPipe(({ state }) => {
    const body = state.get("body"); // string
  });
```

### Processing

#### redirectPipe

HTTP redirect:

```typescript
import redirectPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/redirect.pipe.ts";

// Basic redirect (302)
new Route(EMethod.GET, "/old")
  .addPipe(redirectPipe("/new"));

// Permanent redirect (301)
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

Options:

```typescript
filePipe("./file.txt", {
  contentType: "text/plain",
  noThrow: true,
  continue: true,
  statusCode: 200,
  cacheControl: 3600
});
```

#### htmlPipe

Serve HTML:

```typescript
import htmlPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/html.pipe.ts";

new Route(EMethod.GET, "/page")
  .addPipe(htmlPipe("<h1>Hello World</h1>"));
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

```typescript
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";

healthcheckPlugin(api);
// Adds GET/HEAD /healthz endpoint
```

### Status

```typescript
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";

statusPlugin(api);
// Adds /status endpoint with server info
```

### Access Log

```typescript
import accessLogPlugin from "https://deno.land/x/deno_api_server/plugins/access-log/plugin.ts";

accessLogPlugin(api, {
  log: (req, res) => console.log(`${req.method} ${req.url} ${res.status}`)
});
```

### Add Route Logger

```typescript
import addRoutePlugin from "https://deno.land/x/deno_api_server/plugins/add-route/plugin.ts";

addRoutePlugin(api, {
  log: (route) => console.log(`Registered: ${route.methods} ${route.matcher.uri}`)
});
```

---

## Examples

### Complete API Example

```typescript
import { Api, EMethod, Route, KeyMatch, RequestError, EPatternTypes, BreakPipe } from "https://deno.land/x/deno_api_server/mod.ts";
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";
import redirectPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/redirect.pipe.ts";

const api = new Api({ port: 8080 });

// Health check
api.addRoute(
  new Route([EMethod.HEAD, EMethod.GET], "/healthz")
);

// GET with URL params
api.addRoute(
  new Route(
    EMethod.GET,
    new KeyMatch("/users/:id", { id: { type: "number" } })
  )
    .addPipe(({ match, response }) => {
      response.body = { userId: match.params.get("id") };
    })
);

// POST with JSON body
api.addRoute(
  new Route(EMethod.POST, "/users")
    .addPipe(jsonBodyPipe)
    .addPipe(({ state, response }) => {
      response.body = { created: true, data: state.get("body") };
      response.status = 201;
    })
);

// Redirect
api.addRoute(
  new Route(EMethod.GET, "/old-page")
    .addPipe(redirectPipe("/new-page"))
);

// Error handling
api.addRoute(
  new Route(EMethod.GET, "/error")
    .addPipe(() => {
      throw new RequestError("Something went wrong", 400);
    })
);

// State management
api.addRoute(
  new Route(EMethod.GET, "/timed")
    .addPipe(({ state }) => {
      state.set("start", Date.now());
    })
    .addPipe(({ state, response }) => {
      response.body = { took: Date.now() - state.get("start") };
    })
);

console.log(`Server running at ${api.host}`);
await api.listen();
```

### JWT Authentication Example

```typescript
import { Api, EMethod, Route, IContext } from "https://deno.land/x/deno_api_server/mod.ts";
import { makeJwt, setExpiration, Jose, Payload } from "https://deno.land/x/djwt/mod.ts";

const api = new Api({ port: 8080 });

const key = await crypto.subtle.generateKey(
  { name: "HS256" },
  true,
  ["sign", "verify"]
);

const header: Jose = {
  alg: "HS256",
  typ: "JWT",
};

// Login route
api.addRoute(
  new Route(EMethod.POST, "/login")
    .addPipe(({ request, response }) => {
      // Validate credentials (simplified)
      const payload: Payload = {
        iss: "deno-api",
        exp: setExpiration(new Date().getTime() + 60000),
        authenticated: true,
      };
      
      const jwt = makeJwt({ key, header, payload });
      response.body = { token: jwt };
    })
);

// Protected route
const authPipe = ({ request, di, response }: IContext) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new RequestError("Missing token", 401);
  
  // Verify token
  // ...
};

api.addRoute(
  new Route(EMethod.GET, "/protected")
    .addPipe(authPipe)
    .addPipe(({ response }) => {
      response.body = { data: "secret" };
    })
);

await api.listen();
```

---

## Best Practices

### 1. Keep Pipes Small

Each pipe should do one thing well:

```typescript
// Good: focused responsibility
.addPipe(authPipe)
.addPipe(validationPipe)
.addPipe(loggingPipe)
.addPipe(handlerPipe)

// Avoid: do everything in one pipe
.addPipe(({ request, response, di }) => {
  // Auth, validation, logging, and handling all mixed
})
```

### 2. Use Events for Cross-Cutting Concerns

```typescript
// Instead of adding auth to every route
addEventListener(EEvent.BEFORE_ROUTE, (event) => {
  // Global auth check
});
```

### 3. Mock Dependencies in Tests

```typescript
api.mockInjections({
  db: mockDatabase,
  cache: mockCache,
  logger: mockLogger
});
```

### 4. Use Proper Error Types

```typescript
// Good: proper error with status code
throw new RequestError("Invalid input", 400);

// Avoid: generic errors
throw new Error("Invalid input");
```

### 5. Order Routes by Specificity

```typescript
// Specific routes first
api.addRoute(new Route(EMethod.GET, "/users/:id"));
api.addRoute(new Route(EMethod.GET, "/users"));
api.addRoute(new Route(EMethod.GET, "/"));
```

### 6. Use TypeScript Types

```typescript
import { IContext, IRoute, IPipe } from "https://deno.land/x/deno_api_server/mod.ts";

const myPipe = ({ request, response, state }: IContext) => {
  // Full type support
};
```

---

## Migration Guide

### From v0.5.x to v0.6.0

#### Health Check

**Before:**
```typescript
import healthzRoute from "https://deno.land/x/deno_api_server/src/presets/routes/healthz.ts";
api.addRoute(healthzRoute);
```

**After:**
```typescript
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";
healthcheckPlugin(api);
```

#### Status Endpoint

**Before:**
```typescript
import statusRoute from "https://deno.land/x/deno_api_server/src/presets/routes/status.ts";
api.addRoute(statusRoute);
```

**After:**
```typescript
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";
statusPlugin(api);
```

---

## Troubleshooting

### Route Not Matching

1. Check route order (more specific routes should come first)
2. Verify HTTP method matches
3. Check matcher syntax

### Pipe Not Executing

1. Check if previous pipe returned `BreakPipe`
2. Verify pipe was added to route
3. Check for errors in previous pipes

### Injection Not Working

1. Verify injection was added with `inject()` or `injections()`
2. Check if using correct key in `di`
3. For testing, ensure `mockInjections()` is called before request

### Testing Issues

1. Ensure proper import from `dev_mod.ts`
2. Check that route is added to mockApi
3. Verify async/await for route execution

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Route not found` | No matching route | Check URL and method |
| `Missing route parameter` | KeyMatch parameter not defined | Add parameter to describe object |
| `Invalid parameter type` | Type transformation failed | Check type matches input |
| `Cannot read property of undefined` | DI service not injected | Add inject() call |

---

## File Structure

```
deno-api-server/
├── mod.ts                    # Main exports
├── dev_mod.ts               # Testing utilities
├── skill.md                 # Developer skill documentation
├── src/
│   ├── definition/
│   │   ├── types.ts         # Core interfaces
│   │   ├── event.ts        # Event constants
│   │   ├── method.ts       # HTTP methods
│   │   └── pattern-map.ts  # Parameter patterns
│   ├── services/
│   │   ├── api.ts          # Api server
│   │   ├── route.ts        # Route class
│   │   └── matcher/
│   │       ├── pattern-match.ts
│   │       ├── key-match.ts
│   │       └── uri-match.ts
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

## API Reference (Quick Table)

### Api Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `addRoute` | `route: IRoute` | `this` |
| `listen` | - | `Promise<void>` |
| `getRouteByRequest` | `request: Request, url?: URL` | `IRoute \| null` |

### Route Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `addPipe` | `pipe: IPipe` | `IRoute` |
| `inject` | `name: string, service: any, overridable?: boolean` | `this` |
| `injections` | `di: IInjections` | `this` |
| `prop` | `name: string, value: any` | `this` |
| `execute` | `url: URL, request: IRequest, response: IResponse` | `Promise<IContext>` |
| `isMatch` | `url: URL` | `boolean` |

### Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `route` | `IRoute` | Current route |
| `di` | `IInjections` | Services |
| `match` | `IMatch` | URL match |
| `url` | `URL` | Request URL |
| `request` | `IRequest` | Request |
| `response` | `IResponse` | Response |
| `state` | `IStateMap` | State |

---

## Support

- Documentation: https://doc.deno.land/https/deno.land/x/deno_api_server/mod.ts
- Issues: https://github.com/deno-api-server/issues
- Examples: See `example/` directory

---

*Last updated: 2026*
