# Route

`src/services/route.ts`

The `Route` class maps an HTTP method + URL pattern to an ordered list of pipe functions.

## Constructor

```typescript
new Route(method: string | string[], uri: string | URLPattern | IMatcher)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `method` | `string \| string[]` | HTTP method(s). Case-insensitive; stored as upper-case. Use `EMethod` constants. |
| `uri` | `string \| URLPattern \| IMatcher` | Route path. See [Routing Guide](../guides/routing.md) for all options. |

```typescript
// Single method, plain string path
new Route(EMethod.GET, "/users")

// Multiple methods
new Route([EMethod.GET, EMethod.HEAD], "/users")

// URLPattern (parameter capture)
new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))

// Custom matcher
new Route(EMethod.GET, new UriMatch("/exact"))
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `methods` | `string[]` (readonly) | Upper-cased HTTP methods |
| `matcher` | `IMatcher` (readonly) | Matcher used to test incoming URLs |
| `di` | `IInjections` | Dependency injection map |
| `props` | `IStateMap` (readonly) | Route-level metadata key-value store |
| `parent` | `any` | Set to the `Api` instance when route is registered |

## Methods

### `addPipe(pipe: IPipe): IRoute`

Appends a pipe to the execution chain. Returns `this` for chaining.

```typescript
route
  .addPipe(authPipe)
  .addPipe(handlerPipe);
```

If a pipe returns `BreakPipe`, execution stops and remaining pipes are skipped.

### `inject(name: string, service: any, overridable?: boolean): Route`

Adds a single service to the DI container. Throws if the name is already registered and `overridable` is not `true`.

```typescript
route.inject("db", database);
route.inject("db", testDb, true); // override allowed
```

### `injections(di: IInjections): Route`

Replaces the entire DI map at once.

```typescript
route.injections({ db, logger, config });
```

### `prop(name: string, value: any): Route`

Stores metadata on the route (e.g. Swagger annotations, access flags).

```typescript
route.prop("swagger", { summary: "List users", tags: ["users"] });
```

### `isMatch(url: URL): boolean`

Returns `true` if the route's matcher accepts the given URL.

### `execute(url, request, response): Promise<IContext>`

Runs all pipes in order. Called internally by `Api`. Throws `RequestError` if the URL is not a match.

## Pipe execution

```
pipe1 → pipe2 → pipe3 → ...
          ↓ returns BreakPipe
         (stop here)
```

All pipes share the same `IContext` object. Mutating `context.response` is how a pipe sets the response body, status, and headers.

## Example

```typescript
import { Api, BreakPipe, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 8080 });

api.addRoute(
  new Route(EMethod.GET, "/greet/:name")
    .injections({ greeting: "Hello" })
    .addPipe(({ match, di, response }) => {
      response.body = { message: `${di.greeting}, ${match.params.name}!` };
    })
);

await api.listen();
```
