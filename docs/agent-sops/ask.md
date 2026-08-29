# Ask mode SOP

| Field | Guidance |
|-------|----------|
| **Purpose** | Read-only analysis, explanation, senior review, architecture questions |
| **Allowed** | Read, Grep, Glob, search; readonly subagents; no file writes |
| **Default workflows** | Senior review via `@senior-review` or `@senior-code-review`; wide codebase map via `explore` subagent. Same-repo GitHub PRs are also reviewed by the Grok 4.6 Alex automation — [alex-pr-review-automation.md](./alex-pr-review-automation.md) |
| **Attach** | `@senior-review` at start of every senior/PR review session |
| **Context budget** | ~90% for single-thread analysis; delegate discovery at ~70–90% |
| **Handoffs** | Review findings → **Agent** for fixes; research → **Plan** for large features |
| **Invoke** | User selects Ask mode; or explicit “review only” / “explain without editing” |
| **Anti-patterns** | Patching code in Ask; mixing review + implementation; pasting full logs into parent |
