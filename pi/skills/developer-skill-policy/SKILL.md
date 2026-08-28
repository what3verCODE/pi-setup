---
name: developer-skill-policy
description: Use when deciding whether to load or rely on a developer skill in this Pi setup. Keeps the agent from stacking broad, overlapping, or low-trust skills.
---

# Developer Skill Policy

Prefer a small, predictable skill set.

## Rules

- Use personally tested/favorite skills only.
- Use Matt Pocock skills for engineering workflow, TypeScript, React, frontend/testing correctness, specs, tickets, review, and triage.
- Treat pstack/Cursor plugins as candidates to review manually, not as default installed behavior.
- Do not use osolmaz/pi-workflows skills by default.
- Do not load broad generic style skills unless the user explicitly asks.
- Do not combine multiple overlapping TypeScript/React/style skills for the same task.
- Prefer repository `AGENTS.md` / `CONTEXT.md` over generic skills when they conflict.
- Treat extensions as mechanics/tools; treat skills as behavioral workflows.

## If uncertain

Ask whether to use a specialized skill or proceed with repository instructions only.
