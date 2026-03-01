# Api

`src/services/api.ts`

The `Api` class is the entry point for the framework. It manages routes, starts the HTTP server, and dispatches lifecycle events.

## Constructor

```typescript
new Api(serverConfig: IServerConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `serverConfig` | `IServerConfig` | Server hostname, port, and TLS options |

```typescript
const api = new Api({ port: 8080 });
const api = new Api({ port: 8443, https: true, hostname: "0.0.0.0" });
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `routes` | `IRoute[]` | All registered routes |
| `serverConfig` | `IServerConfig` | Configuration passed to constructor |
| `forceJsonResponse` | `boolean` | When `true` (default), error messages are wrapped in `{ message }` JSON |
| `props` | `IStateMap` (readonly) | Shared key-value store on the server instance |
| `host` | `string` (getter) | Computed base URL, e.g. `http://localhost:8080` |

## Methods

### `addRoute(route: IRoute): Api`

Registers a route on the server. Dispatches `EEvent.API_ADD_ROUTE`. Returns `this` for chaining.

```typescript
api
  .addRoute(new Route(EMethod.GET, "/users"))
  .addRoute(new Route(EMethod.POST, "/users"));
```

### `listen(): Promise<void>`

Starts the HTTP server and blocks until stopped.

```typescript
await api.listen();
```

**Request lifecycle inside `listen()`:**

1. `EEvent.BEFORE_REQUEST` dispatched with request and response
2. Route matched via `getRouteByRequest()`
3. If matched: `EEvent.BEFORE_ROUTE` → `route.execute()` → `EEvent.AFTER_ROUTE_RESPONSE`
4. If not matched: status set to `404`, `EEvent.ROUTE_NOT_FOUND` dispatched
5. On thrown error: `handleError()` called, `EEvent.ROUTE_ERROR` dispatched
6. Response body auto-serialised to JSON if not a `string` or `Raw` instance

### `getRouteByRequest(request: Request, url?: URL): IRoute | null`

Returns the first route that matches the request method and URL, or `null`.

### `getUrlByRequest(request: Request): URL`

Constructs a `URL` object from the request using `api.host` as the base.

## Response body serialisation

| Body type | Behaviour |
|-----------|-----------|
| `Raw` instance | `raw.body` passed directly to `Response` |
| Non-string object | Serialised with `JSON.stringify`, `Content-Type: application/json` set |
| `string` | Passed as-is |
| `undefined` | No body |

## Error handling

Errors thrown inside pipes are caught and processed by `handleError()`:

- `RequestError` (and subclasses) → response status set from `error.status`
- All other errors → status `500`
- When `forceJsonResponse` is `true`, the message is wrapped: `{ message: "..." }`

## Example

```typescript
import { Api, EMethod, EEvent, RequestEvent, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 3000 });

// Global request logger via events
addEventListener(EEvent.BEFORE_REQUEST, (e) => {
  if (e instanceof RequestEvent) {
    console.log(e.request.method, e.request.url);
  }
});

api.addRoute(
  new Route(EMethod.GET, "/")
    .addPipe(({ response }) => {
      response.body = { ok: true };
    })
);

await api.listen();
```
