[WIP] fix project problems

Fix all issues found in the project-problems audit (2026-03-01).
Work through each item in priority order.

## HIGH — Bugs

1. `src/services/route.ts:138` — replace `for...in` with `for...of` over pipes array
2. `src/presets/pipes/body/json-body.pipe.ts:16` — narrow `catch (e)` before accessing `.message`
3. `src/testing/mock-api.ts:91,100` — type-guard `catch (e)` before passing to typed functions

## MEDIUM — Type Safety

4. `src/services/route.ts:76`, `src/services/api.ts:50`, `plugins/swagger/plugin.test.ts` — replace `obj.hasOwnProperty()` with `Object.hasOwn()`
5. `src/testing/mock-fn.ts:4,12` — replace `Function` type with proper generic signatures
6. All `@ts-ignore` without comment — add explanatory inline comments (14 occurrences)
7. Reduce `any` in core types — `IStateMap`, `IInjections`, `IMatch.params` in `src/definition/types.ts`

## LOW — Code Hygiene

8. `prefer-const` — fix 3 occurrences: `route.ts:139`, `api.ts:55`, `access-log/plugin.ts:34`
9. `no-unused-vars` — prefix unused params with `_` in plugins and examples (7 occurrences)
10. `require-await` — remove unnecessary `async` from test pipe functions (10 occurrences)
