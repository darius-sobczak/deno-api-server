# healthcheck plugin

`plugins/healthcheck/plugin.ts`

Registers a lightweight health-check endpoint that returns `200 OK` with no body.

## Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import plugin from "./plugins/healthcheck/plugin.ts";

const api = new Api({ port: 8080 });

plugin(api);

await api.listen();
```

## Config

```typescript
interface IConfig {
  uri?: string; // default: "/healthz"
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `uri` | `"/healthz"` | Path for the health-check endpoint |

## Behaviour

- Responds to both `GET` and `HEAD` methods
- Returns `200` with an empty body
- The access-log plugin silently ignores `/healthz` requests by default

## Examples

### Default path

```typescript
plugin(api);
// GET /healthz  → 200
// HEAD /healthz → 200
```

### Custom path

```typescript
plugin(api, { uri: "/health" });
// GET /health → 200
```

### Kubernetes / Docker probe

```yaml
# kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

```bash
# Docker HEALTHCHECK
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/healthz || exit 1
```
