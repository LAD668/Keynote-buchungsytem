# UI/UX pass checklist (fast but thorough)

## Scope
- [ ] Identify primary user task on the surface being changed
- [ ] Identify secondary tasks and potential distractions
- [ ] Identify the “happy path” and the top 3 failure/edge cases

## Layout & hierarchy
- [ ] Clear page title and section headings
- [ ] Strong primary action; secondary actions are visually subordinate
- [ ] Consistent spacing rhythm (avoid one-off gaps)
- [ ] Content width and line length are comfortable (desktop + mobile)
- [ ] Dense screens use grouping (cards/sections/dividers) to reduce scan cost

## Forms & inputs
- [ ] Labels are present and unambiguous (not placeholder-only)
- [ ] Error messaging is specific and placed near the field
- [ ] Disabled/loading states are obvious; double-submit is prevented
- [ ] Autofill and mobile keyboards are supported (type, inputMode where useful)

## Navigation & flows
- [ ] Back navigation is predictable; breadcrumbs where helpful
- [ ] Empty states explain what to do next
- [ ] Success states confirm completion and suggest next step

## Accessibility
- [ ] Semantic structure (`main`, headings, lists) is correct
- [ ] Keyboard navigation works for the full flow
- [ ] Focus states are visible and consistent
- [ ] Contrast is sufficient for text and interactive controls
- [ ] Click targets are large enough (mobile)
- [ ] No reliance on color alone to convey meaning

## Responsiveness
- [ ] Layout works at small (phone), medium (tablet), large (desktop)
- [ ] Sticky elements don’t block content
- [ ] Grids collapse gracefully; long text wraps without overflow

## Performance polish
- [ ] Images are optimized (`next/image`, proper sizing)
- [ ] Avoid heavy client components where server components suffice
- [ ] Avoid unnecessary re-renders in interactive lists
