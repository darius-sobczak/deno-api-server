# deno-api-server

A functional HTTP/REST API server framework for Deno. Built on Deno's standard HTTP library with a focus on composability and functional programming patterns.

[![Deno Doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/deno_api_server/mod.ts)
[![Release Notes](./RELEASE_NOTES.md)](./RELEASE_NOTES.md)
[![Getting Started](GETTING_STARTED.md)](GETTING_STARTED.md)

## Features

✅ **Functional Design**: Build APIs using composable pipe functions
✅ **TypeScript First**: Full TypeScript support with comprehensive type definitions
✅ **Lightweight**: Minimal dependencies, built on Deno standard library
✅ **Flexible Routing**: Support for simple strings, URL patterns, and key matching
✅ **Middleware Pipes**: Chainable request/response processing
✅ **Dependency Injection**: Built-in DI system for routes
✅ **Event System**: Hook into server lifecycle events
✅ **Testing Utilities**: Built-in mocking for easy testing
✅ **Plugin System**: Extensible architecture with plugins

## Quick Example

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 8080 });

api.addRoute(
  new Route(EMethod.GET, "/")
    .addPipe(({ response }) => {
      response.body = { message: "Hello API" };
    })
);

console.log(`Server running on http://localhost:${api.serverConfig.port}`);
await api.listen();
```

Run with:
```bash
deno run --allow-net main.ts
```

## Documentation

- **[Getting Started](GETTING_STARTED.md)** - New to deno-api-server? Start here!
- **[API Documentation](API_DOCUMENTATION.md)** - Detailed API reference
- **[Testing Guide](TESTING.md)** - Testing strategies and utilities
- **[Plugins Guide](PLUGINS.md)** - Available plugins and plugin development
- **[Best Practices](BEST_PRACTICES.md)** - Development best practices
- **[Examples Guide](EXAMPLES.md)** - Practical usage examples
- **[Release Notes](RELEASE_NOTES.md)** - What's new and changed

## Core Concepts

### Functional Pipes
The framework is built around the concept of functional pipes - small, focused functions that process requests and responses.

```typescript
// Pipes are just functions that take a context and optionally return a promise
const loggingPipe = (context) => {
  console.log(`Request: ${context.request.method} ${context.request.url}`);
};

const authPipe = async (context) => {
  // Authentication logic here
};

// Chain pipes together
new Route(EMethod.GET, "/secure")
  .addPipe(loggingPipe)
  .addPipe(authPipe)
  .addPipe(handlerPipe);
```

### Route Matching
Support for multiple matching strategies:

```typescript
// Simple string matching
new Route(EMethod.GET, "/users");

// URLPattern matching (standard web API)
new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }));

// KeyMatch with type conversion
import { KeyMatch } from "https://deno.land/x/deno_api_server/mod.ts";
new Route(EMethod.GET, new KeyMatch("/users/:id", { id: { type: "number" } }));
```

### Dependency Injection
Share services between pipes:

```typescript
new Route(EMethod.GET, "/users")
  .injections({
    userService: new UserService()
  })
  .addPipe(({ di }) => {
    const users = di.userService.getAll();
    // ...
  });
```

## Examples

Explore the [examples directory](example/) for practical usage patterns:

- [`main.ts`](example/main.ts) - Comprehensive example with multiple routes
- [`authentification-jwt.ts`](example/authentification-jwt.ts) - JWT authentication
- [`body-validation.ts`](example/body-validation.ts) - Request body validation
- [`unit-testing.test.ts`](example/unit-testing.test.ts) - Testing patterns

## Plugins

Extend functionality with plugins:

- **@deno-api-server/swagger** - API documentation (WIP)
- **@deno-api-server/healthcheck** - Health check endpoints
- **@deno-api-server/status** - Server status monitoring
- **@deno-api-server/access-log** - Request logging
- **@deno-api-server/add-route** - Route registration logging

## Contributing

Contributions are welcome! Please see our [contribution guidelines](CONTRIBUTING.md) (coming soon).

## License

MIT © Darius Sobczak

## Support

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join the conversation and ask questions
- **Documentation**: Help improve our docs

---

**Star this repo if you find it useful!** 🌟
