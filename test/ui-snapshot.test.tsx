/**
 * UI Snapshot Tests
 *
 * Run these tests to capture/compare UI component snapshots.
 * Use `npm test -- --update` to update snapshots after visual verification.
 *
 * One-off usage for dependency updates:
 * 1. Checkout master branch
 * 2. Run: npm test -- test/ui-snapshot.test.tsx --update
 * 3. Checkout the dependency update branch
 * 4. Run: npm test -- test/ui-snapshot.test.tsx
 * 5. If snapshots differ, manually verify the UI looks correct
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import RoomCard from '@/UI/components/RoomCard';
import Circle from '@/UI/components/Circle';
import { Username } from '@/UI/components/Username';

// Mock hooks and modules for stable snapshots
vi.mock('@/UI/components/single/TrainerCard/useTrainerCard', () => ({
    useTrainerCard: () => ({
        clickUsername: vi.fn(),
    }),
}));

// Mock framer-motion to get stable snapshots (removes animation props)
vi.mock('framer-motion', () => ({
    motion: {
        button: ({ children, className, onClick, ...props }: any) => (
            <button className={className} onClick={onClick} data-testid="motion-button">
                {children}
            </button>
        ),
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div">
                {children}
            </div>
        ),
        span: ({ children, className, ...props }: any) => (
            <span className={className} data-testid="motion-span">
                {children}
            </span>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('UI Component Snapshots', () => {
    describe('RoomCard', () => {
        it('renders correctly with all data', () => {
            const room = {
                title: 'Lobby',
                desc: 'The main chat room for Pokemon Showdown!',
                userCount: 1234,
                section: 'Official',
            };
            const { container } = render(
                <RoomCard room={room} onClick={() => {}} index={0} />
            );
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders with single user', () => {
            const room = {
                title: 'Test Room',
                desc: 'A quiet room',
                userCount: 1,
                section: 'Gaming',
            };
            const { container } = render(
                <RoomCard room={room} onClick={() => {}} />
            );
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders with different sections', () => {
            const sections = ['Official', 'Languages', 'Life & Hobbies', 'Battle formats', 'Gaming', 'Entertainment', 'On-site games'];

            sections.forEach(section => {
                const room = {
                    title: `${section} Room`,
                    desc: `Description for ${section}`,
                    userCount: 100,
                    section,
                };
                const { container } = render(
                    <RoomCard room={room} onClick={() => {}} />
                );
                expect(container.innerHTML).toMatchSnapshot(`RoomCard-${section}`);
            });
        });
    });

    describe('Circle (notification bubble)', () => {
        it('renders with number', () => {
            const { container } = render(<Circle>5</Circle>);
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders with double digits', () => {
            const { container } = render(<Circle>99</Circle>);
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders with custom className', () => {
            const { container } = render(<Circle className="custom-class">3</Circle>);
            expect(container.innerHTML).toMatchSnapshot();
        });
    });

    describe('Username', () => {
        it('renders basic username', () => {
            const { container } = render(<Username user="TestUser" />);
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders with colon', () => {
            const { container } = render(<Username user="TestUser" colon />);
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders bold', () => {
            const { container } = render(<Username user="TestUser" bold />);
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders colorless', () => {
            const { container } = render(<Username user="TestUser" colorless />);
            expect(container.innerHTML).toMatchSnapshot();
        });

        it('renders with rank prefix', () => {
            const { container } = render(<Username user="@Moderator" bold colon />);
            expect(container.innerHTML).toMatchSnapshot();
        });
    });
});

describe('CSS Class Snapshots (Tailwind output verification)', () => {
    it('captures common Tailwind classes used in the app', () => {
        const { container } = render(
            <div>
                {/* Primary colors */}
                <div className="bg-primary text-white">Primary</div>
                <div className="bg-secondary text-text">Secondary</div>

                {/* Blue variants */}
                <div className="bg-blue-100">Blue 100</div>
                <div className="bg-blue-200">Blue 200</div>
                <div className="bg-blue-300">Blue 300</div>
                <div className="bg-blue-pastel">Blue Pastel</div>
                <div className="bg-blue-dark">Blue Dark</div>

                {/* Gray variants */}
                <div className="bg-gray-75 text-white">Gray 75</div>
                <div className="bg-gray-100">Gray 100</div>
                <div className="bg-gray-300 text-white">Gray 300</div>
                <div className="bg-gray-600 text-white">Gray 600</div>

                {/* Red variants */}
                <div className="bg-red-400 text-white">Red 400</div>
                <div className="bg-red-pastel">Red Pastel</div>

                {/* Green variants */}
                <div className="bg-green-400">Green 400</div>
                <div className="bg-green-pastel">Green Pastel</div>

                {/* Yellow highlight */}
                <div className="bg-yellow-hl-body text-white">Yellow HL Body</div>
                <div className="bg-yellow-hl-body-light">Yellow HL Body Light</div>

                {/* Layout classes */}
                <div className="flex flex-col gap-2 p-4 m-2 rounded-lg">
                    <span className="text-sm font-bold">Layout Test</span>
                    <span className="text-xs text-gray-125">Small text</span>
                </div>

                {/* Hover states */}
                <div className="hover:bg-gray-351 dark:hover:bg-gray-350 transition-colors">
                    Hover Color Class
                </div>
            </div>
        );
        expect(container.innerHTML).toMatchSnapshot();
    });
});
