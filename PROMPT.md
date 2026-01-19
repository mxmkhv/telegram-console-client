# telegram-console-client Implementation Prompt

## Task

Implement the telegram-console-client according to `spec.md` and the implementation plan in `docs/plans/2026-01-19-telegram-console-client.md`.

## Rules

1. **TDD Always**: Write failing test first, then implement, then verify test passes
2. **Type Safety**: Run `bun run typecheck` after every code change
3. **Linting**: Run `bun run lint` after every code change
4. **Small Commits**: Commit after each task completes successfully
5. **No Skipping**: Complete each task fully before moving to the next

## Verification Commands

After EVERY code change, run these in order:

```bash
bun run typecheck && bun run lint && bun test
```

If any command fails:
1. Read the error carefully
2. Fix the issue
3. Re-run all verification commands
4. Only proceed when ALL pass

## Implementation Flow

For each task in the plan:

### Step 1: Write Test (if applicable)
```bash
# Create/modify test file
# Run test to verify it FAILS
bun test <path-to-test>
```

### Step 2: Implement
```bash
# Write minimal code to pass test
# Run verification
bun run typecheck && bun run lint && bun test
```

### Step 3: Commit
```bash
git add -A && git commit -m "<type>: <message>"
```

### Step 4: Move to Next Task

## Package.json Scripts Required

Ensure these scripts exist in `package.json`:

```json
{
  "scripts": {
    "dev": "bun run src/index.tsx",
    "build": "bun build src/index.tsx --outdir dist --target node",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

If scripts are missing, add them before proceeding.

## Current Progress

Check git log and existing files to determine current progress:

```bash
git log --oneline -10
ls -la src/
```

Resume from the first incomplete task.

## Task Checklist

Work through these phases in order. Mark each complete only when:
- Tests pass
- Types check
- Lint passes
- Changes committed

### Phase 1: Project Foundation
- [ ] Task 1: Initialize Project (package.json, tsconfig, entry point)
- [ ] Task 2: Config Module with Tests
- [ ] Task 3: Environment Variable Override Tests

### Phase 2: Telegram Service Layer
- [ ] Task 4: Telegram Service Types
- [ ] Task 5: Telegram Service Mock for Testing
- [ ] Task 6: Real Telegram Service (GramJS Wrapper)

### Phase 3: State Management
- [ ] Task 7: App State and Reducer with Tests
- [ ] Task 8: React Context Provider

### Phase 4: UI Components
- [ ] Task 9: StatusBar Component
- [ ] Task 10: ChatList Component
- [ ] Task 11: MessageView Component
- [ ] Task 12: InputBar Component

### Phase 5: Setup Flow
- [ ] Task 13: Welcome Screen Component
- [ ] Task 14: API Credentials Component
- [ ] Task 15: QR Auth Component
- [ ] Task 16: Phone Auth Component
- [ ] Task 17: Setup Flow Orchestrator

### Phase 6: Main App Integration
- [ ] Task 18: Main App Component
- [ ] Task 19: Update Entry Point

### Phase 7: Build & Distribution
- [ ] Task 20: Production Build Setup

### Phase 8: Final Integration Testing
- [ ] Task 21: Integration Test with Mock Service
- [ ] Task 22: Add README

## Completion Criteria

ALL of the following must be true:

1. All 22 tasks completed and committed
2. `bun run typecheck` passes with zero errors
3. `bun run lint` passes with zero errors
4. `bun test` passes with zero failures
5. `bun run build` succeeds
6. `bun run dev -- --mock` launches the app successfully
7. README.md exists with usage instructions

When ALL criteria are met, output:

<promise>COMPLETE</promise>

## Error Recovery

If stuck on a task for more than 3 attempts:

1. Read the error message completely
2. Check if dependencies are installed: `bun install`
3. Check if imports are correct
4. Check if types match the spec
5. Look at similar working code in the project
6. Simplify the implementation

If still stuck after 10 iterations on the same task:
1. Document the blocker in `BLOCKERS.md`
2. Skip to the next task if possible
3. Return to blocked task later

## Reference Files

- `spec.md` - Full specification
- `docs/plans/2026-01-19-telegram-console-client.md` - Detailed implementation plan with code

Always refer to these files for exact implementation details.
