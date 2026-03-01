# Getting Started

## Requirements

- [Deno](https://deno.land) 1.40+

## Installation

No install step needed. Import directly:

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
```

## First endpoint

Create `main.ts`:

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

const api = new Api({ port: 8080 });

api.addRoute(
  new Route(EMethod.GET, "/")
    .addPipe(({ response }) => {
      response.body = { message: "Hello World" };
    })
);

console.log("Listening on http://localhost:8080");
await api.listen();
```

Run:

```bash
deno run --allow-net main.ts
```

Test:

```bash
curl http://localhost:8080/
# {"message":"Hello World"}
```

## Route with a path parameter

```typescript
api.addRoute(
  new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
    .addPipe(({ match, response }) => {
      response.body = { id: match.params.id };
    })
);
```

## Reading a JSON body

```typescript
import { jsonBodyPipe } from "https://deno.land/x/deno_api_server/src/presets/mod.ts";

api.addRoute(
  new Route(EMethod.POST, "/users")
    .addPipe(jsonBodyPipe)
    .addPipe(({ state, response }) => {
      const body = state.get("body");
      response.status = 201;
      response.body = { created: body };
    })
);
```

## Error responses

Throw a framework error inside any pipe — the status is set automatically:

```typescript
import { NotFoundError } from "https://deno.land/x/deno_api_server/mod.ts";

api.addRoute(
  new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
    .addPipe(async ({ match, response }) => {
      const user = await db.find(match.params.id);
      if (!user) throw new NotFoundError("User not found");
      response.body = user;
    })
);
```

## Project structure

A typical project layout:

```
project/
├── main.ts          # Api setup and server start
├── routes/
│   ├── users.ts     # Route definitions for /users
│   └── auth.ts      # Route definitions for /auth
├── pipes/
│   ├── auth.pipe.ts # Reusable auth pipe
│   └── log.pipe.ts  # Reusable logging pipe
└── deno.json
```

```typescript
// routes/users.ts
import { EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

export const listUsersRoute = new Route(EMethod.GET, "/users")
  .addPipe(({ response }) => {
    response.body = [];
  });
```

```typescript
// main.ts
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import { listUsersRoute } from "./routes/users.ts";

const api = new Api({ port: 8080 });
api.addRoute(listUsersRoute);
await api.listen();
```

## deno.json

```json
{
  "tasks": {
    "start": "deno run --allow-net main.ts",
    "dev": "deno run --allow-net --watch main.ts",
    "test": "deno test --allow-net"
  }
}
```
