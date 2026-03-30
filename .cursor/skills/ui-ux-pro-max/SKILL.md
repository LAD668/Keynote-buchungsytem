---
name: ui-ux-pro-max
description: Improves UI/UX in this Next.js + Tailwind app by running a structured design pass (IA, flows, accessibility, responsive, components). Use when the user asks for UI polish, UX improvements, redesign, landing page tweaks, component library work, Tailwind styling, accessibility fixes, or visual consistency.
---

# UI/UX Pro Max

## Quick start

When the user asks for UI/UX changes:

1. Identify the target surfaces
   - Pages/routes (e.g. `app/**/page.tsx`)
   - Shared layouts (e.g. `app/**/layout.tsx`)
   - Reusable components (e.g. `components/ui/**`)

2. Do a fast UX pass
   - Information architecture and primary task
   - Critical path and friction points
   - Mobile-first layout and spacing
   - Accessibility: focus states, keyboard nav, contrast, semantic structure

3. Convert findings into an implementation plan
   - Prefer small, composable UI primitives in `components/ui/`
   - Prefer design tokens via Tailwind config/CSS variables over ad-hoc styles
   - Keep components under 200 lines; split by responsibility

4. Implement changes with these constraints
   - No inline styles (Tailwind only)
   - No console logs
   - Strict TypeScript (no `any` unless unavoidable)
   - Handle loading + error states for async work

5. Validate
   - Run the linter on edited files
   - Spot-check responsive breakpoints
   - Verify keyboard navigation on key flows

## Working agreement (project conventions)

- Prefer editing/adding primitives in `components/ui/` before duplicating markup.
- Use consistent spacing scale (Tailwind spacing) and typography scale.
- Prefer `next/image` for images and ensure appropriate sizes.
- Keep visual language consistent across pages (buttons, cards, inputs, badges).

## Output templates

### UI/UX change proposal (use in chat)

Provide:
- **Goal**: what user outcome improves
- **Surfaces**: which routes/components are affected
- **Design decisions**: 3–6 bullets (layout, hierarchy, states)
- **Implementation plan**: file list + what changes
- **Test plan**: responsive + a11y checks

### Component spec (use before building a new UI component)

Define:
- **Name** and location (`components/ui/...`)
- **Variants** (e.g. size, tone, intent)
- **States** (default/hover/active/disabled/loading/error)
- **A11y** (role, aria, focus handling)
- **Props types** (exported)

## Checklists

- For the full UX pass checklist, see [CHECKLIST.md](CHECKLIST.md).
- For a recommended UI component shape, see [COMPONENT_TEMPLATE.md](COMPONENT_TEMPLATE.md).

## When assets exist (data/scripts)

If `ui-ux-pro-max` data/scripts are later added to this repo, extend this skill with:
- A short “how to run” section for each script
- Input/output contracts for any data files
- Validation steps (what “good output” looks like)
