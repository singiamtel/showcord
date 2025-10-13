# Integration Test Suite

This directory contains integration tests for the Showcord Pokemon Showdown client.

## Structure

```
test/
├── README.md                     # This file
├── setupTests.js                 # Test configuration and global mocks
├── config.ts                     # Test configuration
├── helpers/
│   └── mockServer.ts            # Mock server utilities for simulating PS server
└── integration/
    ├── client.test.ts           # Core client functionality tests
    ├── battle.test.ts           # Battle room specific tests
    └── message-handling.test.ts # Message parsing tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/integration/client.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Test Helpers

### MockServer

The `MockServer` class simulates a Pokemon Showdown server by providing methods to send protocol messages:

```typescript
import { MockServer, createMockWebSocket } from '../helpers/mockServer';

const mockWS = createMockWebSocket();
const mockServer = new MockServer((data) => mockWS.triggerMessage(data));

// Send messages
mockServer.sendChallstr('test123');
mockServer.joinRoom('lobby', 'chat');
mockServer.sendChat('lobby', 'user', 'Hello!', '1234567890');
```

### Key Methods

- `sendChallstr(challstr)` - Send authentication challenge
- `joinRoom(roomId, type)` - Initialize a room
- `setRoomTitle(roomId, title)` - Set room title
- `sendUserList(roomId, users)` - Send user list
- `sendChat(roomId, user, message, timestamp)` - Send chat message
- `sendPM(from, to, message)` - Send private message
- `userJoin/Leave(roomId, username)` - User join/leave events
- `sendBattlePlayer/Request/Line()` - Battle-specific messages

## Current Status

⚠️ **Note**: The client currently detects the Vitest environment and skips WebSocket initialization. This needs to be addressed to make the integration tests fully functional.

### Working Tests
- Message protocol format parsing
- Mock server utilities
- Test structure and organization

### To Fix
- Client initialization in test mode (bypassing `import.meta.env.VITEST` check)
- localStorage mocking for Settings
- Window event mocking

## Writing New Tests

When adding new integration tests:

1. **Set up mocks in beforeEach**:
```typescript
beforeEach(() => {
    mockWebSocket = createMockWebSocket();
    global.WebSocket = vi.fn(() => mockWebSocket) as any;
    client = new Client({ autoLogin: false });
    mockWebSocket.triggerOpen();
});
```

2. **Use MockServer for server messages**:
```typescript
mockServer.joinRoom('testroom', 'chat');
mockServer.sendChat('testroom', 'user', 'message');
```

3. **Assert on client state**:
```typescript
const room = client.room('testroom');
expect(room?.messages.length).toBeGreaterThan(0);
```

4. **Clean up in afterEach**:
```typescript
afterEach(() => {
    global.WebSocket = originalWebSocket;
});
```

## Test Coverage Goals

- Core protocol handling: 100%
- Room operations: 100%
- Message parsing: 95%+ (all common types)
- Battle flow: 90%+ (main game loop)

## Next Steps

1. Fix client test mode detection to allow WebSocket mocking
2. Add authentication flow tests
3. Add room management edge case tests
4. Add notification tracking tests
5. Add client-side command tests (`/highlight`, etc.)
6. Add battle request handling tests
7. Consider E2E tests against a real Pokemon Showdown server
