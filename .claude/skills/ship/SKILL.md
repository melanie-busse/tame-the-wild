---
name: ship
description: Run TypeScript type check, linter, Expo build verification, create a local git commit, and push changes
---

# Skill: /ship

When this skill is invoked, execute the following steps in order. Abort immediately if any step fails.

## Steps

0. **Stop Development Server**
   Ensure no stray Metro bundler processes are locking ports (inform the user if needed).

1. **Type Check (TypeScript)**
   Execute `npx tsc --noEmcit` immediately without asking for confirmation.
   If any TypeScript errors are found, stop and report them. Do not continue.

2. **Run Linter**
   Execute `npm run lint` immediately without asking for confirmation (if configured).
   If lint reports any errors, stop and report them. Do not continue.

3. **Expo Build / Prebuild Check**
   Execute `npx expo run:android` or `npx expo export` (depending on the check needed) or verify configuration files.
   If the check fails, stop and report the errors. Do not continue.

4. **Local Git Commit**
   If all previous steps pass, prompt the user *once* for a commit message (or use the context of the current task if provided).
   Then execute:
   - `git add .`
   - `git commit -m "<commit_message>"`

5. **Final Instruction**
   Remind the user to execute `git push` manually or push directly if configured.

Report the result of each step to the user as you go.