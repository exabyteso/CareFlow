# Agent mode SOP

| Field | Guidance |
|-------|----------|
| **Purpose** | Implement, test, refactor, commit when asked |
| **Allowed** | Edits, shell, Task subagents, merges |
| **Default workflows** | Multi-wave features per [agent-and-subagent-workflow.md](../agent-and-subagent-workflow.md); runner/fixer for slow tests |
| **Attach** | `@.cursor/rules/agent-orchestration.mdc` before spawning Task subagents or parallel waves |
| **Firebase** | On first local run or auth/`GET /me` failure, follow [ONBOARDING.md](../../ONBOARDING.md#firebase-localhost) (always-on rule `.cursor/rules/firebase-localhost.mdc`). Phantom only — no keys in chat. |
| **Context budget** | Parent orchestrating: ~85%; workers: ~90%; delegate before 90% on heavy reads |
| **Handoffs** | After slice → **Ask** senior review; from **Plan** → execute wave todos in order |
| **Invoke** | User selects Agent mode; “implement”, “fix”, “build with subagents” |
| **Anti-patterns** | Parallel agents on same file; deep review + patches one thread; full E2E + broad refactor monolith |
