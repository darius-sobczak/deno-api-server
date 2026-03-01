# Planed — Planning Skill

Plans are stored in `docs/plans/*.md`. Each file starts with a status header on the first line:

```
[STATUS] Title of the plan
```

## Statuses

| Status | Meaning |
|--------|---------|
| `[WIP]` | Being written — not ready for implementation |
| `[OPEN]` | Ready to implement |
| `[PROGRESS]` | Currently being implemented |
| `[TEST]` | Implementation done, awaiting verification |
| `[DONE]` | Finished |

## Rules

- When you start working on a plan: update status `[OPEN]` → `[PROGRESS]`
- When implementation is complete: update status `[PROGRESS]` → `[TEST]`
- Keep the plan in `[TEST]` for user feedback after implementation
- Only when the user explicitly says "finish it" (or equivalent), move `[TEST]` → `[DONE]`
- For every implementation task, run verification with `go test ./...` (or `make test`) before marking a plan as `[DONE]`
- Before commit on "finish it", ensure the plan is already updated from `[TEST]` to `[DONE]`
- Commit messages on "finish it" should describe the latest updates
- Always rewrite the **first line** of the plan file when changing status — never add a second header
- If the user asks about plans, list the files in `docs/plans/` and their current status

## Workflow

1. Read the relevant plan from `docs/plans/` before starting
2. Update the first line to `[PROGRESS] <title>` when you begin
3. Follow the plan steps
4. Update the first line to `[TEST] <title>` when done implementing and request user feedback
5. Wait for the user's response while keeping the plan in `[TEST]`
6. If the user says "finish it" (or equivalent), update to `[DONE] <title>` before committing

## "Implement next plan" command

When the user says something like:
- "implement next plan"
- "work on next plan"
- "start next plan"
- "what's the next plan"
- `cap` (shorthand for "commit and implement next plan" — first commit any pending changes, then implement the next plan)

Do the following:

1. List all files in `docs/plans/`
2. Parse the first line of each to read the status
3. Pick the first plan with status `[OPEN]` (alphabetical order by filename)
4. Read the full plan content to understand the goal and steps
5. Update its first line to `[PROGRESS] <title>` before starting any code changes
6. Implement the plan
7. Update to `[TEST] <title>` when done, then verify and ask for feedback
8. Only if the user says "finish it", update to `[DONE] <title>` and commit

If no `[OPEN]` plan exists, tell the user and list current plan statuses.

## Agent lock file

When an agent begins implementing a plan (status → `[PROGRESS]`), it **must** create a lock file next to the plan:

`docs/plans/<plan-name>.md.lock`

The lock file must contain metadata in JSON, for example:

```json
{
  "agent": "<AGENTNAME>",
  "createdAt": "YYYY-MM-DD",
  "tool": "codex",
  "note": "working on implementation"
}
```

- `<AGENTNAME>` is the agent's name or model identifier (e.g. `Claude`, `Codex`)
- Keep the plan title clean (no `(WIP by ...)` suffix)
- While the `.md.lock` file exists, the plan is locked and must not be changed through the app
- When the agent finishes the plan, it **must remove** `docs/plans/<plan-name>.md.lock` to unlock it

## Agent plan mode

When an agent uses plan mode to design an implementation and the plan is approved and ready to execute:

1. Append the full plan to the relevant `docs/plans/*.md` file
2. Use this exact headline format:

```
# Implementation plan by <AGENTNAME> at <YYYY-MM-DD>
```

Replace `<AGENTNAME>` with the agent's name or model identifier, and `<YYYY-MM-DD>` with the current date.

**Exception:** If the user explicitly says they do not want the plan written to the file (e.g. "don't update the file", "skip writing the plan"), skip this step.
