import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { Client } from '@/client/client';
import HTML from '@/UI/chatFormatting/Html';
import { RoomContext } from '@/UI/components/RoomContext';
import { ClientContext } from '@/UI/components/single/ClientContext.types';

const poll = [
    '<div class="infobox">',
    '<p><span>Poll</span> <strong>Choose a package manager</strong></p>',
    '<div><button value="/poll vote 1" title="Vote for option one">1. <strong>Option one</strong></button></div>',
    '<div><button value="/poll vote 2">2. <strong>A longer option two</strong></button></div>',
    '<div><button value="/poll results"><small>(View results)</small></button></div>',
    '</div>',
].join('');

describe('Showdown HTML poll controls', () => {
    test('gives poll options and results distinct classes', () => {
        const client = { send: vi.fn() } as unknown as Client;
        const { container } = render(
            <ClientContext value={{ client, messages: [], rooms: [], setRoom: vi.fn() }}>
                <RoomContext value="lobby">
                    <HTML message={poll} />
                </RoomContext>
            </ClientContext>,
        );

        const options = container.querySelectorAll('.showdown-poll-option');
        const results = container.querySelector('.showdown-poll-results');

        expect(options).toHaveLength(2);
        expect(options[0]).toHaveAttribute('title', 'Vote for option one');
        expect(results).toHaveTextContent('(View results)');
    });

    test('sends the selected poll command through the client', () => {
        const send = vi.fn();
        const client = { send } as unknown as Client;
        const { getByRole } = render(
            <ClientContext value={{ client, messages: [], rooms: [], setRoom: vi.fn() }}>
                <RoomContext value="lobby">
                    <HTML message={poll} />
                </RoomContext>
            </ClientContext>,
        );

        fireEvent.click(getByRole('button', { name: '1. Option one' }));

        expect(send).toHaveBeenCalledWith('/poll vote 1', '');
    });
});
