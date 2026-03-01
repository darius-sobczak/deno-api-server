[DONE] upgrade all libs

Implemented: 2026-03-01 by Claude Sonnet 4.6

update all external libs for this projects, use always latest stable version

# Implementation plan by Claude Sonnet 4.6 at 2026-03-01

## Changes made

### `deno.json`
- `@std/assert`: `https://deno.land/std@0.224.0/testing/asserts.ts` → `jsr:@std/assert`
- `@std/path`: `https://deno.land/std@0.224.0/path/mod.ts` → `jsr:@std/path`
- Removed `@std/http` entry (replaced by built-in `Deno.serve`)

### `src/deps.ts`
- Removed `serve` import from `@std/http`
- Added thin wrapper that delegates to `Deno.serve(options, handler).finished`
  so the existing `api.ts` call site needs no change

### Not changed
- `https://deno.land/x/multiparser@0.114.0` — left as-is per user instruction
