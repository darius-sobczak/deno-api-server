# Types & Interfaces

`src/definition/types.ts`

All public TypeScript interfaces and types exported from `mod.ts`.

## Core types

### `IPipe`

```typescript
type IPipe = (context: IContext) => void | symbol | Promise<void | symbol>;
```

A pipe is a function that receives the current request context. Return `BreakPipe` to halt the pipe chain.

### `BreakPipe`

```typescript
const BreakPipe: unique symbol;
```

Return this from any pipe to stop execution of subsequent pipes for the current request.

```typescript
const authPipe: IPipe = ({ request, response }) => {
  if (!isAuthorized(request)) {
    response.status = 401;
    return BreakPipe; // skip remaining pipes
  }
};
```

---

## `IContext`

The object passed to every pipe. All properties are references — mutations persist across the pipe chain.

```typescript
interface IContext {
  route: IRoute;       // the matched Route instance
  di: IInjections;     // dependency injection map from route.injections()
  match: IMatch;       // URL match result (params, url, uri)
  url: URL;            // parsed request URL
  request: IRequest;   // native Request (alias of Request)
  response: IResponse; // mutable response object
  state: IStateMap;    // per-request key-value store (Map)
}
```

### `IMatch`

```typescript
interface IMatch {
  params: IStateMap;                          // path parameters
  url: URL;
  uri: string;                                // matched URI pattern
  matches?: RegExpMatchArray | URLPatternResult; // raw match result
  [key: string]: any;
}
```

Access path parameters from `context.match.params`:

```typescript
// Route: new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
// GET /users/42
const id = context.match.params.id; // "42"
```

---

## `IResponse`

The mutable response object used by pipes.

```typescript
interface IResponse {
  status: number;
  message?: string;
  body?: any;
  headers: Headers;
}
```

Set `body` to any serialisable value — the `Api` class auto-serialises objects to JSON unless `Content-Type` is already set or the body is a `Raw` instance.

---

## `IServerConfig`

```typescript
interface IServerConfig {
  port: number;
  hostname?: string;  // default: "localhost"
  https?: boolean;    // default: false
}
```

---

## `IInjections`

```typescript
interface IInjections {
  [key: string]: any;
}
```

The DI map exposed as `context.di` inside pipes.

---

## `IStateMap`

```typescript
interface IStateMap {
  [key: string]: any;
}
```

Used for `context.state` (a `Map`) and route/api `props` (also a `Map`).

---

## `IRoute`

The interface implemented by the `Route` class.

```typescript
interface IRoute {
  methods: string[];
  matcher: IMatcher;
  di: IInjections;
  parent?: any;
  isMatch(url: URL): boolean;
  addPipe(pipe: IPipe): IRoute;
  execute(url: URL, request: IRequest, response: IResponse): Promise<IContext>;
}
```

---

## `IMatcher`

```typescript
interface IMatcher {
  readonly uri: string;
  getMatch(url: URL): IMatching;
}
```

Implement this interface to create custom route matchers.

### `IMatching`

```typescript
type IMatching = IMatch | null;
```

Return `null` if the URL does not match, or an `IMatch` object if it does.

---

## `IRequest`

```typescript
type IRequest = Request; // native Fetch API Request
```
