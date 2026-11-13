# ADR — TanStack Form with Zod for all user input

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

react-hook-form ran one form, the query editor, through the wrappers now in `components/ReactHookForm.tsx`. Every other input lived in hand-rolled React state with hand-written validation, so each screen invented its own rules for when an error shows, when a value saves, and how a field reports itself as invalid to assistive technology.

## Decision

All user input goes through TanStack Form, using `useAppForm` from `@/components/form`, with a Zod schema for every form. Field components are built on the shadcn `Field` components: `data-invalid` on `Field`, `aria-invalid` on the control, and `FieldError errors={field.state.meta.errors}`, shown when the field is touched and invalid. A form works in one of two modes:

- **Submit.** `validationLogic: revalidateLogic()` with `validators.onDynamic: schema`. Errors show after the first submit, then follow each change, as react-hook-form's default did. Bare `validators.onSubmit` clears an error on a valid change but doesn't show it again on an invalid one until the next submit.
- **Auto-save.** `validators.onChange: schema`, plus a form-level `listeners.onChange` that calls `handleSubmit()` when the form is valid, with an `onChangeDebounceMs` above 0. The debounce is required because TanStack Form runs change listeners before change validation, so without one the `isValid` check reads the previous change's result and drops the edit that fixes an invalid value. The persisted atom stays the store: the form's defaults read it, `onSubmit` writes it, and an external write to the atom calls `form.reset(next)`.

Two rules hold in both modes:

- `onSubmit` parses `value` with the schema again (`schema.parse(value)`), because TanStack Form passes the raw input, not the schema's output.
- Render code reads form state through `form.Subscribe` or `useSelector(form.store, selector)` from `@tanstack/react-form`, never `form.state`, because `useAppForm` doesn't subscribe the component to the form store, so a direct `form.state` read in render never updates. A test in `components/form/useAppForm.test.tsx` proves both subscribed reads re-render in compiled components. Event handlers may read `form.state`.

**Focusing the first invalid field.** `onSubmitInvalid` focusing the form's first `[aria-invalid="true"]` element was tested on a three-field form in happy-dom. Both the synchronous call and the same call deferred with `requestAnimationFrame` moved focus to the first invalid field after each failed submit. Enter-to-submit wasn't tested, because the form had only text areas. happy-dom isn't a browser, so the helper keeps the deferred call unless a browser test shows the synchronous one is enough. It ships with its first consumer.

## Considered Options

- **Keep react-hook-form.** It worked for the query editor, but that form needed a hand-written sync between its value and its Jotai atom, and auto-save would need the same watching on every screen.
- **Plain React state with Zod.** No dependency, but every form would rewrite touched state, error timing, and submit state.
- **TanStack Form with Zod (chosen).** Typed field names, Zod accepted directly through Standard Schema, form-level listeners for auto-save, and a `createFormHook` registry for shared field components.

## Consequences

- react-hook-form, `@hookform/resolvers`, and the wrappers in `components/ReactHookForm.tsx` stay until their remaining users move, with no new uses.
- The react-hook-form wrappers moved from `components/Form.tsx` to `components/ReactHookForm.tsx`. On a case-insensitive filesystem such as macOS's default, `@/components/form` resolved to `Form.tsx` before `form/index.ts`.
- A new field component registers in `components/form/useAppForm.ts` and is named `<Control>FormField`, which keeps it apart from the legacy `TextAreaField`, `SelectField`, and `CheckboxField`.
