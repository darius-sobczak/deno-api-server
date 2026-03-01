# Pipe System

Pipes are the core abstraction. A pipe is a plain function that receives the request context and optionally mutates the response.

## Pipe signature

```typescript
type IPipe = (context: IContext) => void | symbol | Promise<void | symbol>;
```

Pipes can be sync or async. Return nothing (or `undefined`) to continue to the next pipe. Return `BreakPipe` to stop.

## `BreakPipe`

```typescript
import { BreakPipe } from "https://deno.land/x/deno_api_server/mod.ts";
```

Returning `BreakPipe` from any pipe immediately stops the chain. Remaining pipes are not called.

```typescript
const guardPipe: IPipe = ({ request, response }) => {
  if (!request.headers.get("x-api-key")) {
    response.status = 401;
    response.body = { error: "Unauthorized" };
    return BreakPipe;
  }
};
```

## Adding pipes to a route

```typescript
new Route(EMethod.GET, "/dashboard")
  .addPipe(guardPipe)     // runs first
  .addPipe(logPipe)       // runs second (only if guard passes)
  .addPipe(handlerPipe);  // runs last
```

## The context object

Every pipe receives the same `IContext`:

| Property | Type | Description |
|----------|------|-------------|
| `request` | `Request` | Native Fetch API request (read-only) |
| `response` | `IResponse` | Mutable response: `status`, `body`, `headers`, `message` |
| `match` | `IMatch` | URL match result: `params`, `url`, `uri` |
| `url` | `URL` | Parsed request URL |
| `di` | `IInjections` | Services from `route.injections()` |
| `state` | `Map<string,any>` | Per-request scratch space for inter-pipe communication |
| `route` | `IRoute` | The matched route instance |

## Passing data between pipes

Use `context.state` (a `Map`) to share data:

```typescript
// pipe 1: parse body
const parseBodyPipe: IPipe = async ({ request, state }) => {
  state.set("body", await request.json());
};

// pipe 2: use parsed body
const handlerPipe: IPipe = ({ state, response }) => {
  const body = state.get("body");
  response.body = { received: body };
};

new Route(EMethod.POST, "/echo")
  .addPipe(parseBodyPipe)
  .addPipe(handlerPipe);
```

## Reusable pipe factories

Parameterise pipes by wrapping them in a factory function:

```typescript
function requireHeader(header: string): IPipe {
  return ({ request, response }) => {
    if (!request.headers.has(header)) {
      response.status = 400;
      response.body = { error: `Missing header: ${header}` };
      return BreakPipe;
    }
  };
}

new Route(EMethod.POST, "/upload")
  .addPipe(requireHeader("content-type"))
  .addPipe(uploadHandlerPipe);
```

## Async pipes

```typescript
const fetchUserPipe: IPipe = async ({ match, state }) => {
  const user = await db.users.findById(match.params.id);
  state.set("user", user);
};
```

## Setting response headers

```typescript
const corsPipe: IPipe = ({ response }) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
};
```

## Setting response status

```typescript
const createdPipe: IPipe = ({ response }) => {
  response.status = 201;
};
```

## Throwing errors

Throw a framework error to abort and set a status automatically:

```typescript
import { NotFoundError, BadRequestError } from "https://deno.land/x/deno_api_server/mod.ts";

const findUserPipe: IPipe = async ({ match, state }) => {
  const user = await db.find(match.params.id);
  if (!user) throw new NotFoundError("User not found");
  state.set("user", user);
};
```

See [errors.md](../api/errors.md) for available error classes.

## Raw response body

Use `Raw` to return binary or streaming content without JSON serialisation:

```typescript
import { Raw } from "https://deno.land/x/deno_api_server/src/services/raw.ts";

const streamPipe: IPipe = async ({ response }) => {
  const file = await Deno.open("./data.bin", { read: true });
  response.body = new Raw(file.readable);
  response.headers.set("Content-Type", "application/octet-stream");
  return BreakPipe;
};
```

## Pipe composition patterns

### Pre/post middleware via shared pipes

```typescript
const loggingPipe: IPipe = ({ request }) => {
  console.log(request.method, request.url);
};

// Apply to multiple routes
for (const route of protectedRoutes) {
  route.addPipe(authPipe);
}
```

### Conditional pipe execution

```typescript
function onlyFor(methods: string[], pipe: IPipe): IPipe {
  return (ctx) => {
    if (methods.includes(ctx.request.method)) {
      return pipe(ctx);
    }
  };
}
```
