# Plugin System

Plugins are plain functions that receive the `Api` instance and a config object. They use the public API (add routes, listen to events) to extend the server.

## Plugin signature

```typescript
function plugin(api: Api, config: IConfig): void
```

## Using a plugin

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import accessLog from "./plugins/access-log/plugin.ts";

const api = new Api({ port: 8080 });

accessLog(api, { log: console.log });

await api.listen();
```

## Available plugins

| Plugin | File | Description |
|--------|------|-------------|
| access-log | [access-log.md](access-log.md) | HTTP request logging |
| healthcheck | [healthcheck.md](healthcheck.md) | `/healthz` health endpoint |
| status | [status.md](status.md) | `/status` endpoint |
| add-route | [add-route.md](add-route.md) | Route registration logging |
| swagger | [swagger.md](swagger.md) | OpenAPI 3.0 JSON generation |

## Writing a plugin

A plugin is just a function. Use `api.addRoute()` to add endpoints, `addEventListener()` to hook lifecycle events.

```typescript
import { Api, EEvent, RequestEvent } from "https://deno.land/x/deno_api_server/mod.ts";

interface IConfig {
  prefix?: string;
}

export default function myPlugin(api: Api, config: IConfig = {}) {
  // Listen to events
  addEventListener(EEvent.BEFORE_REQUEST, (e) => {
    if (e instanceof RequestEvent) {
      console.log(`[${config.prefix ?? "LOG"}]`, e.request.method, e.request.url);
    }
  });

  // Or add routes
  // api.addRoute(new Route(...));
}
```

## Plugin conventions

- Export a `default` function as the plugin entry point
- Accept `api` as the first argument and an options object as the second
- Give the options object a default (`config = {}`) so the plugin works with no config
- Do not mutate `api.serverConfig`
