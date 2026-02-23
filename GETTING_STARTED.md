# Getting Started with deno-api-server

Welcome to deno-api-server! This guide will help you get up and running quickly.

## Installation

deno-api-server is a Deno module, so no separate installation is needed beyond Deno itself.

### Prerequisites
- Deno 1.25.0 or higher
- Basic TypeScript/JavaScript knowledge

### Quick Start

```bash
# Create a new project directory
mkdir my-api-server
cd my-api-server

# Initialize a new Deno project
touch main.ts
```

## Your First API Server

Here's a simple "Hello World" API server:

```typescript
// main.ts
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

// Create API instance
const api = new Api({ port: 8080 });

// Add a simple route
api.addRoute(
  new Route(EMethod.GET, "/")
    .addPipe(({ response }) => {
      response.body = { message: "Hello API" };
    })
);

// Start the server
console.log(`Server running on http://localhost:${api.serverConfig.port}`);
await api.listen();
```

### Run Your Server

```bash
deno run --allow-net --allow-env main.ts
```

Then visit `http://localhost:8080` in your browser or use curl:

```bash
curl http://localhost:8080
# Output: {"message":"Hello API"}
```

## Project Structure

A typical deno-api-server project looks like this:

```
my-api-server/
├── main.ts              # Main server entry point
├── routes/              # Route definitions
│   ├── user.routes.ts   # User-related routes
│   └── product.routes.ts # Product-related routes
├── services/           # Business logic/services
│   ├── user.service.ts  # User service
│   └── auth.service.ts  # Authentication service
├── pipes/              # Custom pipes
│   ├── auth.pipe.ts     # Authentication pipe
│   └── validation.pipe.ts # Validation pipe
├── config.ts            # Configuration
└── tests/               # Tests
    ├── routes/          # Route tests
    └── services/        # Service tests
```

## Core Concepts

### Api
The main server class that handles HTTP requests and routes.

```typescript
const api = new Api({ port: 8080, hostname: "localhost" });
```

### Route
Defines an API endpoint with HTTP method and URI pattern.

```typescript
const route = new Route(EMethod.GET, "/users");
```

### Pipes
Middleware functions that process requests and responses.

```typescript
route.addPipe(async (context) => {
  // Process request
  console.log("Request received");
  
  // Modify response
  context.response.body = { data: "processed" };
});
```

## Basic Examples

### Handling Different HTTP Methods

```typescript
// GET request
api.addRoute(
  new Route(EMethod.GET, "/users")
    .addPipe(({ response }) => {
      response.body = { users: ["Alice", "Bob"] };
    })
);

// POST request
api.addRoute(
  new Route(EMethod.POST, "/users")
    .addPipe(({ response, request }) => {
      response.body = { message: `User created with ${request.method}` };
    })
);

// Multiple methods for same route
api.addRoute(
  new Route([EMethod.GET, EMethod.POST], "/items")
    .addPipe(({ response, request }) => {
      response.body = { method: request.method };
    })
);
```

### Using URL Parameters

```typescript
import { KeyMatch } from "https://deno.land/x/deno_api_server/mod.ts";

api.addRoute(
  new Route(
    EMethod.GET,
    new KeyMatch("/users/:id", { id: { type: "number" } })
  )
    .addPipe(({ response, match }) => {
      const userId = match.params.id;
      response.body = { userId: userId, message: `User ${userId}` };
    })
);
```

### Working with Request Body

```typescript
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";

api.addRoute(
  new Route(EMethod.POST, "/users")
    .addPipe(jsonBodyPipe) // Parse JSON body
    .addPipe(({ response, state }) => {
      const userData = state.get("body");
      response.body = {
        message: "User created",
        user: userData
      };
    })
);
```

## Next Steps

Now that you have a basic understanding, explore these topics:

1. **[API Documentation](API_DOCUMENTATION.md)** - Detailed API reference
2. **[Testing Guide](TESTING.md)** - Testing strategies and utilities
3. **[Plugins Guide](PLUGINS.md)** - Available plugins and plugin development
4. **[Best Practices](BEST_PRACTICES.md)** - Development best practices
5. **[Examples Guide](EXAMPLES.md)** - Practical usage examples