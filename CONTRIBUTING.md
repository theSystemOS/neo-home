# Contributing

neo-home is part of ExOS. Changes are small, reviewable, and honest about what
they do not do.

## Before you start

- Open an issue for a behavior change or a new concept. The data model is the
  contract; adding a status or an event type needs agreement first.
- One logical change per pull request.
- Never present illustrative content as real. If a screen shows sample work,
  it must carry the `illustrative` label and a demo store.

## Rules

1. **The log is the truth.** State is derived by folding events. Do not add a
   mutable state file, and do not write records by hand.
2. **Every write is attributable.** An event carries an actor and a revision
   context. Refuse a write you cannot attribute.
3. **The surface cannot grant authority.** Buttons may only express events the
   store already permits. A disabled state belongs in the rules, not in CSS.
4. **Keep completion honest.** `verified` requires evidence; `accepted`
   requires a human decision after verification. Never infer either.
5. **Tests first for rules.** Every transition or refusal gets a test.
6. **No product data.** No names, emails, phone numbers, payment or tax details
   in records. Reference facts about data, aggregate only.
7. **No personal language.** This repository is used by more than one person.
   Do not encode an individual's name, machine paths, or private context.

## Development

```bash
npm test
npm start
npm run demo
```

No dependencies and no build step are deliberate. Keep it that way unless a
proposal justifies the cost.

## DCO

Every commit must be signed off:

```bash
git commit -s -m "store: refuse self-verification"
```

The sign-off certifies you wrote the contribution or have the right to submit
it under the project's MIT license.

## Pull request gate

- `npm test` passes.
- The change is demoable in a fresh store, or the pull request says why not.
- The status document is updated when the line between real and planned moves.
- No secret, no personal data, no generated `data/` file.
