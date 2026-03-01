# access-log plugin

`plugins/access-log/plugin.ts`

Logs each incoming HTTP request using the `EEvent.BEFORE_REQUEST` event.

## Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import plugin from "./plugins/access-log/plugin.ts";

const api = new Api({ port: 8080 });

plugin(api, { log: console.log });

await api.listen();
```

## Config

```typescript
interface IConfig {
  log: (...data: any[]) => void;  // required — logging function
  title?: string | false;         // prefix label; false = no label; default "Access"
  noTimestamp?: boolean;          // omit ISO timestamp; default false
  noIgnoreCheck?: boolean;        // include /healthz requests; default false
  ignorePatterns?: RegExp[];      // additional URLs to ignore
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `log` | — | Any logger function, e.g. `console.log` |
| `title` | `"Access"` | Prefix prepended to each log line. Set to `false` to omit. |
| `noTimestamp` | `false` | When `true`, skips the ISO timestamp |
| `noIgnoreCheck` | `false` | When `false` (default), requests to `/healthz` are silently skipped |
| `ignorePatterns` | `[]` | Array of `RegExp`s — matching URLs are not logged |

## Log format

```
Access 2024-01-15T10:30:00.000Z GET http://localhost:8080/users Mozilla/5.0 ...
```

Format: `[title] [timestamp] METHOD URL user-agent`

## Examples

### Minimal

```typescript
plugin(api, { log: console.log });
```

### Custom logger

```typescript
import { createLogger } from "./logger.ts";
const logger = createLogger();

plugin(api, {
  log: (...args) => logger.info(args.join(" ")),
  title: "HTTP",
});
```

### No timestamp, no label

```typescript
plugin(api, {
  log: console.log,
  title: false,
  noTimestamp: true,
});
// Output: GET http://localhost:8080/users Mozilla/5.0 ...
```

### Ignore patterns

```typescript
plugin(api, {
  log: console.log,
  ignorePatterns: [/\/internal\//, /\.(css|js|png)$/],
});
```
