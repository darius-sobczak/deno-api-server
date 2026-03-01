# Errors

`src/errors/`

The framework provides a small hierarchy of HTTP-aware errors. Throwing any of these inside a pipe sets the response status automatically.

## Error hierarchy

```
Error
└── RequestError          (status: any, default 500)
    ├── NotFoundError     (status: 404)
    ├── BadRequestError   (status: 400)
    └── AccessDeniedError (status: 403)
```

---

## `RequestError`

`src/errors/request.error.ts`

Base class for all framework errors.

```typescript
class RequestError extends Error {
  readonly status: number;
  readonly prevent: Error | undefined;

  constructor(message: string, status: number = 500, prevent?: Error)
}
```

| Parameter | Description |
|-----------|-------------|
| `message` | Human-readable error description |
| `status` | HTTP status code (default: `500`) |
| `prevent` | Original cause (optional) |

```typescript
throw new RequestError("Something went wrong", 422);
```

---

## `NotFoundError`

```typescript
class NotFoundError extends RequestError {
  constructor(message: string, prevent?: Error)
  // status always 404
}
```

```typescript
import { NotFoundError } from "https://deno.land/x/deno_api_server/mod.ts";

const getUserPipe = async ({ match, response }: IContext) => {
  const user = await db.find(match.params.id);
  if (!user) {
    throw new NotFoundError(`User ${match.params.id} not found`);
  }
  response.body = user;
};
```

---

## `BadRequestError`

```typescript
class BadRequestError extends RequestError {
  constructor(message: string = "Bad request", status: number = 400, prevent?: Error)
}
```

Use when request input is invalid (missing fields, wrong format, etc.).

```typescript
import { BadRequestError } from "https://deno.land/x/deno_api_server/mod.ts";

const validatePipe = ({ state }: IContext) => {
  const body = state.get("body");
  if (!body?.email) {
    throw new BadRequestError("email is required");
  }
};
```

---

## `AccessDeniedError`

```typescript
class AccessDeniedError extends RequestError {
  constructor(message: string = "Access denied", status: number = 403, prevent?: Error)
}
```

```typescript
import { AccessDeniedError } from "https://deno.land/x/deno_api_server/mod.ts";

const authPipe = ({ request }: IContext) => {
  if (!request.headers.get("authorization")) {
    throw new AccessDeniedError();
  }
};
```

---

## How errors are handled

The `Api` class catches errors thrown from any pipe in its `listen()` loop:

1. If the error is a `RequestError`, `response.status` is set to `error.status`
2. Otherwise, `response.status` is set to `500`
3. When `api.forceJsonResponse` is `true` (default), the message becomes `{ message: "..." }`
4. `EEvent.ROUTE_ERROR` is dispatched with the error

You can disable JSON wrapping:

```typescript
const api = new Api({ port: 8080 });
api.forceJsonResponse = false;
```

---

## Custom errors

Extend `RequestError` to create domain-specific errors:

```typescript
import { RequestError } from "https://deno.land/x/deno_api_server/mod.ts";

class UnprocessableError extends RequestError {
  constructor(message: string) {
    super(message, 422);
  }
}

class ConflictError extends RequestError {
  constructor(message: string) {
    super(message, 409);
  }
}
```
