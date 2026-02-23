# Plugins Guide

This guide covers the plugin system for deno-api-server, including available plugins and how to create your own.

## Table of Contents

- [What are Plugins?](#what-are-plugins)
- [Available Plugins](#available-plugins)
  - [Health Check Plugin](#health-check-plugin)
  - [Status Plugin](#status-plugin)
  - [Access Log Plugin](#access-log-plugin)
  - [Add Route Plugin](#add-route-plugin)
  - [Swagger Plugin (WIP)](#swagger-plugin-wip)
- [Using Plugins](#using-plugins)
- [Creating Custom Plugins](#creating-custom-plugins)
- [Plugin Development Best Practices](#plugin-development-best-practices)
- [Plugin Configuration](#plugin-configuration)

## What are Plugins?

Plugins are self-contained modules that extend the functionality of deno-api-server. They can:

- Add new routes to your API
- Listen to events and modify behavior
- Add middleware or processing logic
- Provide utility functions
- Monitor and log activity

### Why Use Plugins?

- **Modularity**: Keep your main code clean by organizing features into plugins
- **Reusability**: Share plugins across multiple projects
- **Maintainability**: Isolate features for easier updates and debugging
- **Community**: Share useful plugins with other developers

## Available Plugins

### Health Check Plugin

Adds a health check endpoint to your API for monitoring purposes.

#### Installation

```typescript
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";
```

#### Basic Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";

const api = new Api({ port: 8080 });

healthcheckPlugin(api);

// Adds GET /healthz and HEAD /healthz endpoints
await api.listen();
```

#### Configuration

```typescript
healthcheckPlugin(api, {
  path: "/health", // Optional: custom path (default: /healthz)
  checks: async () => {
    // Custom health checks
    return {
      database: "healthy",
      cache: "healthy"
    };
  }
});
```

#### Example Response

```bash
curl http://localhost:8080/healthz
# Response: OK
```

#### Use Cases

- Kubernetes/Docker health checks
- Load balancer health monitoring
- Automated monitoring systems
- Deployment health verification

### Status Plugin

Provides detailed server status and information.

#### Installation

```typescript
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";
```

#### Basic Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";

const api = new Api({ port: 8080 });

statusPlugin(api);

// Adds GET /status endpoint
await api.listen();
```

#### Configuration

```typescript
statusPlugin(api, {
  path: "/status", // Optional: custom path (default: /status)
  body: {
    name: "My API",
    version: "1.0.0",
    environment: Deno.env.get("ENV") || "development"
  }
});
```

#### Example Response

```bash
curl http://localhost:8080/status
# Response:
{
  "name": "My API",
  "version": "1.0.0",
  "environment": "development",
  "routes": 5,
  "uptime": 12345
}
```

#### Use Cases

- Debugging and diagnostics
- API information display
- Monitoring dashboards
- Deployment verification

### Access Log Plugin

Logs all HTTP requests to your API.

#### Installation

```typescript
import accessLogPlugin from "https://deno.land/x/deno_api_server/plugins/access-log/plugin.ts";
```

#### Basic Usage

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import accessLogPlugin from "https://deno.land/x/deno_api_server/plugins/access-log/plugin.ts";

const api = new Api({ port: 8080 });

accessLogPlugin(api, {
  log: console.log
});

await api.listen();
```

#### Configuration

```typescript
accessLogPlugin(api, {
  log: (req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.status}`);
  },
  include: {
    headers: false, // Include headers in log
    body: false    // Include request body in log
  }
});
```

#### Example Output

```
[2024-01-15T10:30:45.123Z] GET /users 200
[2024-01-15T10:30:46.456Z] POST /users 201
[2024-01-15T10:30:47.789Z] GET /users/123 404
```

#### Advanced Logging

```typescript
import { createLogger } from "https://deno.land/x/deno_api_server/src/logger.ts";

const logger = createLogger({
  level: "info",
  format: "json"
});

accessLogPlugin(api, {
  log: (req, res) => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.status,
      userAgent: req.headers.get("user-agent")
    });
  }
});
```

#### Use Cases

- Debugging and troubleshooting
- Security auditing
- Analytics and monitoring
- Request tracking

### Add Route Plugin

Logs all routes as they are added to the API.

#### Installation

```typescript
import addRoutePlugin from "https://deno.land/x/deno_api_server/plugins/add-route/plugin.ts";
```

#### Basic Usage

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
import addRoutePlugin from "https://deno.land/x/deno_api_server/plugins/add-route/plugin.ts";

const api = new Api({ port: 8080 });

addRoutePlugin(api, {
  log: console.log
});

// Adding routes will be logged
api.addRoute(new Route(EMethod.GET, "/users"));
api.addRoute(new Route(EMethod.POST, "/users"));

await api.listen();
```

#### Configuration

```typescript
addRoutePlugin(api, {
  log: (route) => {
    console.log(`Registered route: ${route.methods.join(", ")} ${route.matcher.uri}`);
  },
  format: "detailed" // Optional: "simple" or "detailed"
});
```

#### Example Output

```
Registered route: GET,POST /users
Registered route: GET /users/:id
```

#### Use Cases

- Development debugging
- Route registration verification
- API documentation generation
- Route auditing

### Swagger Plugin (WIP)

Generates OpenAPI/Swagger specification for your API.

**Status**: Work in Progress

#### Installation

```typescript
import swaggerPlugin from "https://deno.land/x/deno_api_server/plugins/swagger/plugin.ts";
```

#### Basic Usage

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
import swaggerPlugin from "https://deno.land/x/deno_api_server/plugins/swagger/plugin.ts";

const api = new Api({ port: 8080 });

const route = new Route(EMethod.GET, "/test")
  .prop("swagger", {
    tags: ["examples"],
    summary: "Get test data",
    description: "Returns sample data for testing"
  })
  .addPipe(({ response }) => {
    response.body = { message: "test" };
  });

api.addRoute(route);

await swaggerPlugin(api, {
  info: {
    title: "My API",
    description: "API documentation",
    version: "1.0.0"
  },
  servers: [{ url: "http://localhost:8080" }]
});

// Access Swagger JSON at /swagger.json
await api.listen();
```

#### Adding Swagger Metadata

```typescript
const route = new Route(EMethod.GET, "/users/:id")
  .prop("swagger", {
    tags: ["users"],
    summary: "Get user by ID",
    description: "Returns a single user",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" }
      }
    ],
    responses: {
      200: {
        description: "User found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" }
              }
            }
          }
        }
      },
      404: {
        description: "User not found"
      }
    }
  })
  .addPipe(({ match, response }) => {
    response.body = { id: match.params.id, name: "Test User" };
  });
```

#### Use Cases

- Interactive API documentation
- Client code generation
- API testing
- Developer onboarding

## Using Plugins

### Installing Multiple Plugins

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import healthcheckPlugin from "https://deno.land/x/deno_api_server/plugins/healthcheck/plugin.ts";
import statusPlugin from "https://deno.land/x/deno_api_server/plugins/status/plugin.ts";
import accessLogPlugin from "https://deno.land/x/deno_api_server/plugins/access-log/plugin.ts";

const api = new Api({ port: 8080 });

// Add plugins
healthcheckPlugin(api);
statusPlugin(api, { body: { name: "My API" } });
accessLogPlugin(api, { log: console.log });

// Add your routes
api.addRoute(yourRoutes);

await api.listen();
```

### Plugin Order Matters

Plugins register event listeners, so the order can affect execution:

```typescript
// Access log should typically be last to catch all requests
statusPlugin(api);
healthcheckPlugin(api);
accessLogPlugin(api); // Added last to log all requests
```

### Conditional Plugin Loading

```typescript
const isProduction = Deno.env.get("ENV") === "production";

if (isProduction) {
  accessLogPlugin(api, {
    log: (req, res) => {
      sendToLoggingService({ method: req.method, url: req.url, status: res.status });
    }
  });
}

if (!isProduction) {
  addRoutePlugin(api, { log: console.log });
}
```

## Creating Custom Plugins

### Plugin Structure

A plugin is a function that accepts an `Api` instance and optional configuration:

```typescript
interface PluginConfig {
  // Plugin-specific options
}

type Plugin = (api: Api, config?: PluginConfig) => void | Promise<void>;
```

### Basic Plugin Example

```typescript
import { Api, EEvent } from "https://deno.land/x/deno_api_server/mod.ts";
import RequestEvent from "https://deno.land/x/deno_api_server/src/definition/events/request.event.ts";

interface TimestampPluginConfig {
  header?: string;
  format?: "iso" | "epoch";
}

export default function timestampPlugin(
  api: Api,
  config: TimestampPluginConfig = {}
) {
  const headerName = config.header || "X-Request-Time";
  const format = config.format || "iso";

  addEventListener(EEvent.BEFORE_REQUEST, (event) => {
    if (event instanceof RequestEvent) {
      const timestamp = format === "iso"
        ? new Date().toISOString()
        : Date.now().toString();

      event.request.headers.set(headerName, timestamp);
    }
  });
}
```

### Using Your Custom Plugin

```typescript
import { Api } from "https://deno.land/x/deno_api_server/mod.ts";
import timestampPlugin from "./plugins/timestamp-plugin.ts";

const api = new Api({ port: 8080 });

timestampPlugin(api, {
  header: "X-Timestamp",
  format: "iso"
});

await api.listen();
```

### Advanced Plugin Example

```typescript
import { Api, EEvent, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";
import RouteEvent from "https://deno.land/x/deno_api_server/src/definition/events/route.event.ts";
import ErrorEvent from "https://deno.land/x/deno_api_server/src/definition/events/error.event.ts";

interface RateLimitPluginConfig {
  requests: number;
  window: number; // in milliseconds
  storage?: Map<string, { count: number; resetTime: number }>;
}

export default function rateLimitPlugin(
  api: Api,
  config: RateLimitPluginConfig
) {
  const storage = config.storage || new Map();
  const { requests, window } = config;

  // Rate limit check middleware
  function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = storage.get(identifier);

    if (!record || now > record.resetTime) {
      storage.set(identifier, {
        count: 1,
        resetTime: now + window
      });
      return true;
    }

    if (record.count >= requests) {
      return false;
    }

    record.count++;
    return true;
  }

  // Add rate limit check before each route
  addEventListener(EEvent.BEFORE_ROUTE, (event) => {
    if (event instanceof RouteEvent) {
      const ip = event.request.headers.get("X-Forwarded-For")
        || event.request.headers.get("X-Real-IP")
        || "unknown";

      if (!checkRateLimit(ip)) {
        event.response.status = 429;
        event.response.body = {
          error: "Too many requests",
          retryAfter: Math.ceil((storage.get(ip)?.resetTime || 0 - Date.now()) / 1000)
        };
        event.response.headers.set("Retry-After", "60");
      }
    }
  });

  // Track rate limit errors
  addEventListener(EEvent.ROUTE_ERROR, (event) => {
    if (event instanceof ErrorEvent && event.response.status === 429) {
      console.log(`Rate limit exceeded for IP`);
    }
  });
}
```

### Plugin that Adds Routes

```typescript
import { Api, EMethod, Route } from "https://deno.land/x/deno_api_server/mod.ts";

interface MetricsPluginConfig {
  path?: string;
}

export default function metricsPlugin(
  api: Api,
  config: MetricsPluginConfig = {}
) {
  const metricsPath = config.path || "/metrics";

  const metrics = {
    requests: 0,
    errors: 0,
    routes: {} as Record<string, number>
  };

  // Track requests
  addEventListener(EEvent.BEFORE_REQUEST, () => {
    metrics.requests++;
  });

  // Track errors
  addEventListener(EEvent.ROUTE_ERROR, (event) => {
    metrics.errors++;
    const routePath = event.route?.matcher.uri || "unknown";
    metrics.routes[routePath] = (metrics.routes[routePath] || 0) + 1;
  });

  // Add metrics endpoint
  api.addRoute(
    new Route(EMethod.GET, metricsPath)
      .addPipe(({ response }) => {
        response.body = {
          metrics,
          uptime: Date.now()
        };
      })
  );
}
```

## Plugin Development Best Practices

### 1. Keep Plugins Focused

```typescript
// Good: Single responsibility
function authPlugin(api: Api, config: AuthConfig) {
  // Only handles authentication
}

// Avoid: Multiple concerns in one plugin
function everythingPlugin(api: Api) {
  // Auth, logging, validation, etc. - too broad
}
```

### 2. Provide Sensible Defaults

```typescript
// Good: Optional configuration with defaults
export default function myPlugin(api: Api, config: PluginConfig = {}) {
  const path = config.path || "/default-path";
  const enabled = config.enabled ?? true;
}

// Avoid: Required configuration for basic usage
export default function myPlugin(api: Api, config: PluginConfig) {
  // Fails if config not provided
}
```

### 3. Use Type Safety

```typescript
interface PluginConfig {
  path?: string;
  enabled?: boolean;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

export default function myPlugin(
  api: Api,
  config?: PluginConfig
): void {
  // TypeScript provides autocomplete and type checking
}
```

### 4. Handle Errors Gracefully

```typescript
export default function myPlugin(api: Api, config: PluginConfig) {
  try {
    addEventListener(EEvent.BEFORE_ROUTE, (event) => {
      if (event instanceof RouteEvent) {
        // Plugin logic
      }
    });
  } catch (error) {
    console.error(`Plugin error: ${error.message}`);
    // Don't crash the entire application
  }
}
```

### 5. Document Your Plugin

```typescript
/**
 * My Plugin
 *
 * Provides plugin functionality for deno-api-server
 *
 * @param api - The Api instance to attach the plugin to
 * @param config - Plugin configuration options
 * @param config.path - Custom endpoint path (default: "/my-endpoint")
 * @param config.enabled - Enable or disable the plugin (default: true)
 *
 * @example
 * ```typescript
 * import myPlugin from "./my-plugin.ts";
 *
 * const api = new Api({ port: 8080 });
 * myPlugin(api, { path: "/custom" });
 * await api.listen();
 * ```
 */
export default function myPlugin(api: Api, config?: PluginConfig): void {
  // Implementation
}
```

### 6. Clean Up Event Listeners

```typescript
export default function cleanupPlugin(api: Api) {
  const listener = () => {
    console.log("Request received");
  };

  addEventListener(EEvent.BEFORE_REQUEST, listener);

  // Return cleanup function if needed
  return () => {
    removeEventListener(EEvent.BEFORE_REQUEST, listener);
  };
}
```

### 7. Support Testing

```typescript
export default function testablePlugin(api: Api, config: PluginConfig = {}) {
  const storage = config.storage || new Map();

  // Use injected storage for testing
  return {
    storage,
    getMetrics: () => ({
      size: storage.size,
      entries: Array.from(storage.entries())
    })
  };
}
```

## Plugin Configuration

### Environment-Based Configuration

```typescript
const config = {
  environment: Deno.env.get("ENV") || "development",
  isProduction: Deno.env.get("ENV") === "production",
  port: parseInt(Deno.env.get("PORT") || "8080")
};

if (config.isProduction) {
  accessLogPlugin(api, {
    log: (req, res) => sendToProductionLogger(req, res)
  });
} else {
  addRoutePlugin(api, { log: console.log });
}
```

### Configuration Files

```typescript
// config.ts
export const pluginConfig = {
  healthcheck: {
    path: "/healthz"
  },
  status: {
    path: "/status",
    body: {
      name: "My API",
      version: "1.0.0"
    }
  },
  accessLog: {
    log: console.log,
    include: {
      headers: false,
      body: false
    }
  }
};

// main.ts
import { pluginConfig } from "./config.ts";

healthcheckPlugin(api, pluginConfig.healthcheck);
statusPlugin(api, pluginConfig.status);
accessLogPlugin(api, pluginConfig.accessLog);
```

### Plugin Options Reference

| Plugin | Option | Type | Default | Description |
|--------|--------|------|---------|-------------|
| healthcheck | path | string | "/healthz" | Endpoint path |
| healthcheck | checks | function | undefined | Custom health checks |
| status | path | string | "/status" | Endpoint path |
| status | body | object | undefined | Custom status body |
| accessLog | log | function | required | Logging function |
| accessLog | include.headers | boolean | false | Include headers |
| accessLog | include.body | boolean | false | Include request body |
| add-route | log | function | required | Logging function |
| add-route | format | "simple" \| "detailed" | "simple" | Output format |
| swagger | info | object | required | OpenAPI info |
| swagger | servers | array | [] | API servers |

## Additional Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](TESTING.md)
- [Examples Guide](EXAMPLES.md)
- [Event System](API_DOCUMENTATION.md#events-system)
