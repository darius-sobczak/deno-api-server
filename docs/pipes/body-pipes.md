# Body Parsing Pipes

`src/presets/pipes/body/`

Built-in pipes for reading and parsing the request body. Each pipe stores its result in `context.state` so downstream pipes can access it.

## `jsonBodyPipe`

`src/presets/pipes/body/json-body.pipe.ts`

Parses the request body as JSON. Throws `RequestError(400)` if the body is invalid JSON.

```typescript
import jsonBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/json-body.pipe.ts";
```

**State set:**

| Key | Value |
|-----|-------|
| `"body"` | Parsed JSON value |
| `"bodyType"` | `"json"` |

**Usage:**

```typescript
new Route(EMethod.POST, "/users")
  .addPipe(jsonBodyPipe)
  .addPipe(({ state, response }) => {
    const body = state.get("body"); // parsed object
    response.status = 201;
    response.body = { created: body };
  });
```

---

## `rawBodyPipe`

`src/presets/pipes/body/raw-body.pipe.ts`

Reads the request body as a plain text string.

```typescript
import rawBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/raw-body.pipe.ts";
```

**State set:**

| Key | Value |
|-----|-------|
| `"body"` | Request body as `string` (empty string if body not used) |
| `"bodyType"` | `"raw"` |

**Usage:**

```typescript
new Route(EMethod.POST, "/webhook")
  .addPipe(rawBodyPipe)
  .addPipe(({ state, response }) => {
    const raw = state.get("body") as string;
    response.body = { length: raw.length };
  });
```

---

## `formBodyPipe`

`src/presets/pipes/body/form-body.pipe.ts`

Parses multipart form data using [multiparser](https://deno.land/x/multiparser). Throws `BadRequestError` if parsing fails.

```typescript
import formBodyPipe from "https://deno.land/x/deno_api_server/src/presets/pipes/body/form-body.pipe.ts";
```

**Signature:**

```typescript
formBodyPipe(config?: { stateKey?: string; errorMessage?: string }): IPipe
```

| Option | Default | Description |
|--------|---------|-------------|
| `stateKey` | `"body"` | Key used in `context.state` |
| `errorMessage` | `"Invalid form data"` | Error message when parsing fails |

**State set:**

| Key | Value |
|-----|-------|
| `stateKey` (default `"body"`) | `Form` object from multiparser |

The `Form` object contains fields and files. Import `FormFile` for typed access:

```typescript
import formBodyPipe, { FormFile } from "https://deno.land/x/deno_api_server/src/presets/pipes/body/form-body.pipe.ts";
```

**Usage:**

```typescript
new Route(EMethod.POST, "/upload")
  .addPipe(formBodyPipe({}))
  .addPipe(({ state, response }) => {
    const form = state.get("body");
    const file = form.files?.avatar as FormFile;
    const name = form.fields?.name as string;
    response.body = { name, filename: file?.filename };
  });
```

Custom state key:

```typescript
new Route(EMethod.POST, "/submit")
  .addPipe(formBodyPipe({ stateKey: "form", errorMessage: "Please submit a valid form" }))
  .addPipe(({ state }) => {
    const form = state.get("form");
  });
```
