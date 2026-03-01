# status plugin

`plugins/status/plugin.ts`

Registers a `GET /status` endpoint that returns a JSON status body.

## Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import plugin from "./plugins/status/plugin.ts";

const api = new Api({ port: 8080 });

plugin(api);
// GET /status → { "status": "OK" }

await api.listen();
```

## Config

```typescript
interface IConfig {
  body?: any;        // extra fields merged into default { status: "OK" }
  handler?: IPipe;   // custom pipe — overrides body
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `body` | `{}` | Extra fields merged with `{ status: "OK" }` |
| `handler` | — | Custom `IPipe`. When provided, `body` is ignored. |

## Examples

### Extra fields in response

```typescript
plugin(api, {
  body: {
    version: "1.2.3",
    env: Deno.env.get("ENV") ?? "production",
  },
});
// GET /status → { "status": "OK", "version": "1.2.3", "env": "production" }
```

### Custom handler

```typescript
plugin(api, {
  handler: async ({ response }) => {
    const dbOk = await db.ping();
    response.body = {
      status: dbOk ? "OK" : "DEGRADED",
      db: dbOk,
    };
  },
});
```

## `createStatusRoute` helper

The plugin exposes a factory function for creating the status route independently:

```typescript
import { createStatusRoute } from "./plugins/status/plugin.ts";

const route = createStatusRoute({
  uri: "/api/status",
  body: { version: "1.0.0" },
});

api.addRoute(route);
```

```typescript
function createStatusRoute(config?: {
  uri?: string;    // default: "/status"
  body?: any;
  handler?: IPipe;
}): Route
```
