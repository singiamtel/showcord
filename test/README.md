# Integration Test Suite

This directory contains the test harness and integration tests for the Showcord Pokemon Showdown client.

## Structure

```text
test/
├── README.md                      # This file
├── setupTests.js                  # Global setup + strict test guards
├── harness/
│   ├── clientHarness.ts           # Reusable client/socket/server harness
│   ├── consoleGuard.ts            # Unexpected console.error guard
│   └── storeReset.ts              # Zustand store reset helper
├── helpers/
│   └── mockServer.ts              # Mock Pokemon Showdown protocol server
└── integration/
    ├── client.test.ts             # Core client lifecycle/rooms/auth
    ├── battle.test.ts             # Battle initialization/request handling
    ├── battle-cleanup.test.ts     # Forfeit/unload cleanup behavior
    ├── message-handling.test.ts   # Message parsing and PM behavior
    └── protocol-edge-cases.test.ts # Protocol edge cases and robustness
```

## Running Tests

```bash
# Run full strict gate (coverage + thresholds)
npm test
# or:
npm run test:strict

# Run only integration tests
npm run test:integration

# Run only unit-level tests
npm run test:unit

# Run UI snapshot tests
npm run test:ui

# Watch mode
npx vitest --watch
```

## Harness Usage

Use `createClientHarness()` for deterministic integration tests.

```typescript
import { createClientHarness } from '../harness/clientHarness';

let harness = createClientHarness();
let { client, server } = harness;

server.joinRoom('lobby', 'chat');
server.sendChat('lobby', 'user', 'hello');

expect(client.room('lobby')).toBeDefined();

harness.cleanup();
```

`createClientHarness()` provides:
- A fresh `Client` with `skipVitestCheck: true`
- A mocked `WebSocket`
- `MockServer` protocol helpers
- Store reset before and after usage
- Battle lazy-load helper (`waitForBattleEngine`)

## Writing New Tests

1. Use `createClientHarness()` in `beforeEach`.
2. Drive protocol behavior with `harness.server`.
3. Assert state through `harness.client` and room stores.
4. Call `harness.cleanup()` in `afterEach`.
5. Keep tests deterministic (no real network, no random timing assumptions).

## Coverage Gates

Coverage thresholds are enforced in `vite.config.ts`; CI fails if they regress.
