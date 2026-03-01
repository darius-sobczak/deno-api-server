# deno-api-server Documentation

A functional HTTP/REST API server framework for Deno built around composable pipe functions.

## Navigation

### API Reference

| File | Description |
|------|-------------|
| [api/api.md](api/api.md) | `Api` class — server creation, routing, lifecycle |
| [api/route.md](api/route.md) | `Route` class — route definition, pipes, DI |
| [api/types.md](api/types.md) | TypeScript interfaces and type definitions |
| [api/events.md](api/events.md) | Event system and lifecycle hooks |
| [api/errors.md](api/errors.md) | Built-in error classes |

### Guides

| File | Description |
|------|-------------|
| [guides/getting-started.md](guides/getting-started.md) | Installation and first endpoint |
| [guides/routing.md](guides/routing.md) | Routing strategies (string, URLPattern, UriMatch) |
| [guides/pipes.md](guides/pipes.md) | Pipe system, `BreakPipe`, composing pipes |
| [guides/dependency-injection.md](guides/dependency-injection.md) | Injecting services into routes |

### Built-in Pipes

| File | Description |
|------|-------------|
| [pipes/body-pipes.md](pipes/body-pipes.md) | `jsonBodyPipe`, `rawBodyPipe`, `formBodyPipe` |
| [pipes/response-pipes.md](pipes/response-pipes.md) | `htmlPipe`, `filePipe`, `redirectPipe` |

### Plugins

| File | Description |
|------|-------------|
| [plugins/overview.md](plugins/overview.md) | Plugin system and how to write plugins |
| [plugins/access-log.md](plugins/access-log.md) | HTTP request logging |
| [plugins/healthcheck.md](plugins/healthcheck.md) | `/healthz` health-check endpoint |
| [plugins/status.md](plugins/status.md) | `/status` status endpoint |
| [plugins/add-route.md](plugins/add-route.md) | Route registration logging |
| [plugins/swagger.md](plugins/swagger.md) | OpenAPI / Swagger JSON generation |

## Quick Start

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 8080 });

api.addRoute(
  new Route(EMethod.GET, "/hello")
    .addPipe(({ response }) => {
      response.body = { message: "Hello World" };
    })
);

await api.listen();
```

```bash
deno run --allow-net main.ts
```
