# swagger plugin

`plugins/swagger/plugin.ts`

Generates an [OpenAPI 3.0](https://swagger.io/specification/) JSON document at `GET /swagger.json` (or a custom path) by inspecting all registered routes.

## Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import plugin from "./plugins/swagger/plugin.ts";

const api = new Api({ port: 8080 });

plugin(api, {
  info: {
    title: "My API",
    description: "My application API",
    version: "1.0.0",
  },
});

await api.listen();
// GET /swagger.json → OpenAPI document
```

## Config

```typescript
interface IConfig {
  info: ISwaggerInfo;                 // required — OpenAPI info object
  serverUrl?: URL | string;           // extra server URL
  servers?: ISwaggerServer[];         // additional servers list
  tags?: ISwaggerTag[];               // global tag definitions
  basePath?: string;                  // prefix for /swagger.json path
  allowSwaggerRoutes?: boolean;       // include swagger endpoint in output; default false
  definitions?: Record<string, ISwaggerParameterSchema>; // shared schema definitions
}
```

### `ISwaggerInfo`

```typescript
interface ISwaggerInfo {
  title: string;
  description: string;
  version: string;
  termsOfService?: string;
  contact?: { email: string };
  license?: { name: string; url: string };
}
```

## Annotating routes

Set route metadata using `route.prop("swagger", { ... })`:

```typescript
import { EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

new Route(EMethod.GET, new URLPattern({ pathname: "/users/:id" }))
  .prop("swagger", {
    summary: "Get user by ID",
    description: "Returns a single user",
    tags: ["users"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    responses: {
      "200": { description: "User found" },
      "404": { description: "User not found" },
    },
  })
  .addPipe(getUserPipe);
```

### Supported route prop fields

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string` | Short operation description |
| `description` | `string` | Longer description |
| `operationId` | `string` | Unique operation ID |
| `tags` | `string[]` | Tags for grouping |
| `parameters` | `ISwaggerRouteParameter[]` | Path/query/header parameters |
| `responses` | `Record<string, { description: string }>` | Response descriptions |

## Path parameter conversion

`:id` style parameters in route URIs are automatically converted to `{id}` Swagger format:

```
Route URI:   /users/:id
Swagger URI: /users/{id}
```

## Servers

The plugin always appends `api.host` to the servers list. Additional servers can be provided:

```typescript
plugin(api, {
  info: { title: "My API", description: "", version: "1.0.0" },
  servers: [
    { url: "https://api.production.com" },
    { url: "https://api.staging.com" },
  ],
});
```

## Base path

Use `basePath` to namespace the swagger endpoint:

```typescript
plugin(api, {
  basePath: "/v1",
  info: { title: "My API v1", description: "", version: "1.0.0" },
});
// Endpoint: GET /v1/swagger.json
```

## Full example

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
import swaggerPlugin from "./plugins/swagger/plugin.ts";

const api = new Api({ port: 8080 });

swaggerPlugin(api, {
  info: {
    title: "Todo API",
    description: "Simple todo list API",
    version: "0.1.0",
  },
  tags: [{ name: "todos", url: "" }],
});

api.addRoute(
  new Route(EMethod.GET, "/todos")
    .prop("swagger", {
      summary: "List todos",
      tags: ["todos"],
      responses: { "200": { description: "Array of todos" } },
    })
    .addPipe(({ response }) => {
      response.body = [];
    })
);

await api.listen();
```
