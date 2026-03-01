# add-route plugin

`plugins/add-route/plugin.ts`

Logs a line to the console whenever a route is registered on the `Api` instance. Useful for startup diagnostics.

## Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import plugin from "./plugins/add-route/plugin.ts";

const api = new Api({ port: 8080 });

plugin(api, { log: console.log });

api.addRoute(/* ... */); // logs immediately
```

## Config

```typescript
interface IConfig {
  log: (...data: any[]) => void; // required
  title?: string;                // default: "Add Route"
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `log` | — | Logging function |
| `title` | `"Add Route"` | Prefix for each log line |

## Log format

```
Add Route GET,POST /users
```

## Example output

```
Add Route GET /
Add Route GET,HEAD /healthz
Add Route GET /status
Add Route GET /users
Add Route GET /users/:id
```

## Notes

- The plugin listens to `EEvent.API_ADD_ROUTE`, which fires inside `api.addRoute()`
- Routes added _before_ `plugin()` is called are not logged
- Call `plugin()` before `api.addRoute()` calls to capture all routes
