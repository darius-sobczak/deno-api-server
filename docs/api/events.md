# Event System

`src/definition/event.ts`

The framework uses the global `EventTarget` (`addEventListener` / `dispatchEvent`) to expose server lifecycle hooks. No custom event emitter is needed.

## `EEvent` — Event name constants

```typescript
import { EEvent } from "https://deno.land/x/deno_api_server/mod.ts";
```

| Constant | Value | When fired |
|----------|-------|------------|
| `EEvent.API_ADD_ROUTE` | `"API_ADD_ROUTE"` | When `api.addRoute()` is called |
| `EEvent.BEFORE_REQUEST` | `"BEFORE_REQUEST"` | Before route matching, for every request |
| `EEvent.BEFORE_ROUTE` | `"BEFORE_ROUTE"` | After route is matched, before pipes run |
| `EEvent.AFTER_ROUTE_RESPONSE` | `"AFTER_ROUTE_RESPONSE"` | After route pipes complete successfully |
| `EEvent.ROUTE_NOT_FOUND` | `"ROUTE_NOT_FOUND"` | When no route matches the request |
| `EEvent.ROUTE_ERROR` | `"ROUTE_ERROR"` | When a pipe throws an error |
| `EEvent.CRITICAL_ERROR` | `"CRITICAL_ERROR"` | When response serialisation fails |

---

## Event classes

### `RequestEvent`

`src/definition/events/request.event.ts`
Exported from `mod.ts` as `RequestEvent`.

Fired for: `BEFORE_REQUEST`, `AFTER_ROUTE_RESPONSE`, `ROUTE_NOT_FOUND`

```typescript
class RequestEvent extends Event {
  readonly request: IRequest;
  readonly response: IResponse;
}
```

```typescript
import { EEvent, RequestEvent } from "https://deno.land/x/deno_api_server/mod.ts";

addEventListener(EEvent.BEFORE_REQUEST, (event) => {
  if (event instanceof RequestEvent) {
    console.log(event.request.method, event.request.url);
  }
});
```

---

### `RouteEvent`

`src/definition/events/route.event.ts`
Exported from `mod.ts` as `RouteEvent`.

Fired for: `API_ADD_ROUTE`, `BEFORE_ROUTE`

```typescript
class RouteEvent extends Event {
  route: IRoute;
}
```

```typescript
import { EEvent, RouteEvent } from "https://deno.land/x/deno_api_server/mod.ts";

addEventListener(EEvent.API_ADD_ROUTE, (event) => {
  if (event instanceof RouteEvent) {
    console.log("Registered:", event.route.methods, event.route.matcher.uri);
  }
});
```

---

### `ErrorEvent`

`src/definition/events/error.event.ts` (internal, not exported from `mod.ts`)

Fired for: `ROUTE_ERROR`, `CRITICAL_ERROR`

```typescript
class ErrorEvent extends Event {
  error: Error;
  params: Record<string, unknown>; // { request, response }
}
```

Listen using the string event name:

```typescript
addEventListener(EEvent.ROUTE_ERROR, (event) => {
  const e = event as any;
  console.error("Route error:", e.error?.message);
  console.error("Request:", e.params?.request);
});
```

---

## Common patterns

### Request logging

```typescript
addEventListener(EEvent.BEFORE_REQUEST, (e) => {
  if (e instanceof RequestEvent) {
    console.log(`[${new Date().toISOString()}] ${e.request.method} ${e.request.url}`);
  }
});
```

### 404 tracking

```typescript
addEventListener(EEvent.ROUTE_NOT_FOUND, (e) => {
  if (e instanceof RequestEvent) {
    console.warn("404:", e.request.url);
  }
});
```

### Error monitoring

```typescript
addEventListener(EEvent.ROUTE_ERROR, (e) => {
  const err = (e as any).error as Error;
  // Send to error tracking service
  reportError(err);
});
```

### Route inventory

```typescript
addEventListener(EEvent.API_ADD_ROUTE, (e) => {
  if (e instanceof RouteEvent) {
    const { methods, matcher } = e.route;
    console.log(`  ${methods.join("|")} ${matcher.uri}`);
  }
});
```
