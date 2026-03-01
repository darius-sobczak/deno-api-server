# Response Pipes

`src/presets/pipes/process/`

Built-in pipes for sending common response types. All of them return `BreakPipe` by default, stopping subsequent pipes.

## `htmlPipe`

`src/presets/pipes/process/html.pipe.ts`

Sends an HTML string response. Sets `Content-Type: text/html; charset=utf-8` and returns `BreakPipe`.

```typescript
import htmlPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/html.pipe.ts";
```

**Signature:**

```typescript
htmlPipe(html: string): IPipe
```

**Usage:**

```typescript
new Route(EMethod.GET, "/")
  .addPipe(htmlPipe("<h1>Hello World</h1>"));
```

With a template:

```typescript
const page = (name: string) => `
<!DOCTYPE html>
<html><body><h1>Hello, ${name}</h1></body></html>
`;

new Route(EMethod.GET, new URLPattern({ pathname: "/hello/:name" }))
  .addPipe(({ match, response }) => {
    // htmlPipe is a factory — create the pipe dynamically
    const pipe = htmlPipe(page(match.params.name));
    return pipe({ match, response } as any);
  });
```

---

## `filePipe`

`src/presets/pipes/process/file.pipe.ts`

Serves a file from the local filesystem. Auto-detects `Content-Type` from the file extension. Returns `BreakPipe` unless `options.continue` is set.

```typescript
import filePipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/file.pipe.ts";
```

**Signature:**

```typescript
filePipe(filePath: string, options?: IOptions): IPipe
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentType` | `string` | auto-detected | Override `Content-Type` header |
| `noThrow` | `boolean` | `false` | If `true`, stores error in `state.fileError` instead of throwing |
| `continue` | `boolean` | `false` | If `true`, does not return `BreakPipe` after success |
| `cacheControl` | `string \| number \| Date` | — | Sets `Cache-Control` header |
| `statusCode` | `number` | — | Override response status code |

**Usage:**

```typescript
// Serve a static file
new Route(EMethod.GET, "/logo.png")
  .addPipe(filePipe("./public/logo.png"));

// With cache control (1 hour = 3600 seconds)
new Route(EMethod.GET, "/bundle.js")
  .addPipe(filePipe("./dist/bundle.js", { cacheControl: 3600 }));

// Non-throwing — handle missing file in next pipe
new Route(EMethod.GET, new URLPattern({ pathname: "/static/:file" }))
  .addPipe(({ match, state }) => {
    state.set("filePath", `./public/${match.params.file}`);
  })
  .addPipe(async ({ state, response }) => {
    const path = state.get("filePath");
    await filePipe(path, { noThrow: true, continue: true })({ response, state } as any);
    if (state.get("fileError")) {
      response.status = 404;
      response.body = { error: "File not found" };
    }
  });
```

### Helper functions

```typescript
import { mediaTypeByExt, mediaTypeByPath } from "https://deno.land/x/deno_api_server/src/presets/pipes/process/file.pipe.ts";

mediaTypeByExt(".png");           // "image/png"
mediaTypeByPath("./dist/app.js"); // "application/javascript"
```

**Supported extensions:** `.md`, `.html`, `.htm`, `.json`, `.txt`, `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.svg`, `.png`, `.gif`, `.jpg`, `.jpeg`, `.ico`, `.pdf`, `.zip`, `.gz`, `.wasm`, `.mjs`

---

## `redirectPipe`

`src/presets/pipes/process/redirect.pipe.ts`

Sends an HTTP redirect response. Sets `Location` header and returns `BreakPipe`.

```typescript
import redirectPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/process/redirect.pipe.ts";
```

**Signature:**

```typescript
redirectPipe(url: string | URL, status?: number, referrer?: string | URL): IPipe
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `url` | — | Redirect destination |
| `status` | `302` | HTTP status code (`301`, `302`, `307`, `308`) |
| `referrer` | — | Optional `Referrer` header |

**Usage:**

```typescript
// Temporary redirect
new Route(EMethod.GET, "/old-path")
  .addPipe(redirectPipe("/new-path"));

// Permanent redirect
new Route(EMethod.GET, "/legacy")
  .addPipe(redirectPipe("https://example.com/new", 301));

// Redirect with referrer
new Route(EMethod.GET, "/away")
  .addPipe(redirectPipe("https://example.com", 302, "https://myapp.com"));
```
