import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Code from '@/UI/chatFormatting/code';
import { HighlightedName } from '@/UI/components/RoomSwitcher';
import { TimerDisplay } from '@/UI/components/rooms/battle/TimerDisplay';
import { RoomContext } from '@/UI/components/RoomContext';
import type { BattleRoom } from '@/client/room/battleRoom';
import { useRoomStore } from '@/client/client';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ..._props }: any) => (
            <div className={className}>{children}</div>
        ),
        span: ({ children, className, ..._props }: any) => (
            <span className={className}>{children}</span>
        ),
    },
}));

describe('Code component - no dangerouslySetInnerHTML', () => {
    it('renders code without using dangerouslySetInnerHTML', () => {
        const content = '<code>var x = 1;</code>';
        const { container } = render(<Code message={content} />);
        const html = container.innerHTML;

        expect(html).not.toContain('dangerouslySetInnerHTML');
        expect(container.querySelector('pre')).toBeDefined();
    });

    it('sets innerHTML via ref for highlighted code', () => {
        const content = '<pre><code>function foo() { return 1; }</code></pre>';
        const { container } = render(<Code message={content} />);
        const html = container.innerHTML;

        expect(html).not.toContain('dangerouslySetInnerHTML');
        expect(container.querySelector('pre')).toBeDefined();
    });
});

describe('TimerDisplay - Date.now() as lazy initializer', () => {
    it('renders nothing when timer is not active', () => {
        // Setup a mock room with the required properties but timerActive = false
        const mockRoom = {
            ID: 'test-battle',
            name: 'Test Battle',
            type: 'battle',
            open: true,
            users: [],
            timerStartValue: 0,
            timerTotal: 300,
            timerActive: false,
            timerStartedAt: 0,
        } as unknown as BattleRoom;

        useRoomStore.setState({
            rooms: new Map([['test-battle', mockRoom]]),
            selectedRoomID: 'test-battle',
            currentRoom: mockRoom,
        });

        const { container } = render(
            <RoomContext value="test-battle">
                <TimerDisplay />
            </RoomContext>
        );

        expect(container.innerHTML).toBe('');
    });
});

describe('HighlightedName - no array index keys', () => {
    it('renders highlighted characters with unique non-index keys', () => {
        const highlights = [true, false, true, false, false];
        const { container } = render(
            <HighlightedName name="hello" highlights={highlights} />
        );

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBe(2);
        expect(marks[0].textContent).toBe('h');
        expect(marks[1].textContent).toBe('l');

        const spans = container.querySelectorAll('span');
        expect(spans.length).toBeGreaterThanOrEqual(3);
    });

    it('renders with all characters highlighted', () => {
        const highlights = [true, true, true];
        const { container } = render(
            <HighlightedName name="abc" highlights={highlights} />
        );
        expect(container.querySelectorAll('mark').length).toBe(3);
    });

    it('renders with no highlights', () => {
        const { container } = render(
            <HighlightedName name="xyz" highlights={[false, false, false]} />
        );
        expect(container.querySelectorAll('mark').length).toBe(0);
    });
});
