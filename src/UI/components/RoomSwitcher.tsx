import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faHome, faUser, faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { GiBattleAxe } from 'react-icons/gi';
import HashtagIcon from '../assets/hashtag';
import { useClientContext } from './single/useClientContext';
import { useAppStore } from '@/client/stores/appStore';
import type { Room } from '@/client/room/room';

function RoomIcon({ type, id }: Readonly<{ type: string; id: string }>) {
    if (id === 'home') return <FontAwesomeIcon icon={faHome} />;
    if (id === 'settings') return <FontAwesomeIcon icon={faCog} />;
    if (type === 'battle') return <GiBattleAxe />;
    if (type === 'pm') return <FontAwesomeIcon icon={faUser} />;
    return <HashtagIcon height={16} width={16} />;
}

interface FuzzyResult {
    room: Room;
    score: number;
    highlights: boolean[];
}

function fuzzyMatch(target: string, query: string): { score: number; highlights: boolean[] } | null {
    const t = target.toLowerCase();
    const q = query.toLowerCase();
    if (!q) return { score: 0, highlights: Array(target.length).fill(false) };

    const highlights = Array(target.length).fill(false);
    let qi = 0;
    let score = 0;
    let consecutive = 0;

    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            highlights[ti] = true;
            consecutive++;
            // bonus for consecutive matches and for matching at start
            score += consecutive + (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-' ? 5 : 0);
            qi++;
        } else {
            consecutive = 0;
        }
    }

    if (qi < q.length) return null;
    return { score, highlights };
}

function fuzzyFilter(rooms: Room[], query: string): FuzzyResult[] {
    if (!query) return rooms.map(room => ({ room, score: 0, highlights: [] }));

    return rooms
        .map(room => {
            const nameMatch = fuzzyMatch(room.name, query);
            const idMatch = fuzzyMatch(room.ID, query);
            const best = [nameMatch, idMatch].reduce<typeof nameMatch>((a, b) => {
                if (!a) return b;
                if (!b) return a;
                return a.score >= b.score ? a : b;
            }, null);
            if (!best) return null;
            return { room, score: best.score, highlights: nameMatch?.highlights ?? [] };
        })
        .filter((r): r is FuzzyResult => r !== null)
        .sort((a, b) => b.score - a.score);
}

function HighlightedName({ name, highlights }: Readonly<{ name: string; highlights: boolean[] }>) {
    return (
        <>
            {name.split('').map((char, i) => (
                highlights[i] ?
                    <mark key={i} className="bg-transparent text-blue-300 font-semibold">{char}</mark> :
                    <span key={i}>{char}</span>
            ))}
        </>
    );
}

type ActionItem =
    | { kind: 'room'; room: Room; highlights: boolean[] }
    | { kind: 'join'; query: string }
    | { kind: 'pm'; query: string }
    | { kind: 'settings'; section: string };

export function RoomSwitcher() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { rooms, setRoom, client } = useClientContext();
    const inputRef = useRef<HTMLInputElement>(null);

    const fuzzyResults = fuzzyFilter(rooms, query);
    const settingsSections = ['appearance', 'highlighting', 'developer', 'account'] as const;

    const actions: ActionItem[] = [
        ...fuzzyResults.map(r => ({ kind: 'room' as const, ...r })),
        ...(query.trim() ? [
            { kind: 'join' as const, query: query.trim() },
            { kind: 'pm' as const, query: query.trim() },
        ] : []),
        ...settingsSections.map(section => ({ kind: 'settings' as const, section })),
    ];

    const close = useCallback(() => {
        setOpen(false);
        setQuery('');
        setSelectedIndex(0);
    }, []);

    const navigate = useCallback((room: Room) => {
        setRoom(room.ID);
        close();
    }, [setRoom, close]);

    const joinRoom = useCallback((name: string) => {
        client.join(name);
        close();
    }, [client, close]);

    const openPM = useCallback((user: string) => {
        client.createPM(user);
        close();
    }, [client, close]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => {
                    if (!prev) {
                        setQuery('');
                        setSelectedIndex(0);
                    }
                    return !prev;
                });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const setSettingsSection = useAppStore(s => s.setSettingsSection);

    const openSettings = useCallback((section: string) => {
        setSettingsSection(section);
        client.openSettings();
        close();
    }, [client, close, setSettingsSection]);

    const activate = useCallback((action: ActionItem) => {
        if (action.kind === 'room') navigate(action.room);
        else if (action.kind === 'join') joinRoom(action.query);
        else if (action.kind === 'pm') openPM(action.query);
        else openSettings(action.section);
    }, [navigate, joinRoom, openPM, openSettings]);

    if (!open) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            close();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, actions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && actions[selectedIndex]) {
            activate(actions[selectedIndex]);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
            onMouseDown={close}
        >
            <div
                className="w-full max-w-md bg-gray-251 dark:bg-gray-375 rounded-lg shadow-2xl overflow-hidden border border-gray-351 dark:border-gray-250"
                onMouseDown={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Go to room..."
                    className="w-full px-4 py-3 text-base text-text dark:text-text-dark bg-transparent border-b border-gray-351 dark:border-gray-250 outline-none placeholder:text-gray-125"
                />
                <ul className="max-h-72 overflow-y-auto">
                    {actions.length === 0 && (
                        <li className="px-4 py-3 text-sm text-gray-175">No rooms found</li>
                    )}
                    {actions.map((action, i) => {
                        const selected = i === selectedIndex;
                        const rowClass = `flex items-center gap-3 px-4 py-2 cursor-pointer text-sm text-text dark:text-text-dark ${
                            selected ? 'bg-gray-451 dark:bg-gray-450' : 'hover:bg-gray-376 dark:hover:bg-gray-350'
                        }`;

                        if (action.kind === 'room') {
                            return (
                                <li key={action.room.ID} className={rowClass}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    onClick={() => activate(action)}
                                >
                                    <span className="w-4 flex justify-center text-gray-175">
                                        <RoomIcon type={action.room.type} id={action.room.ID} />
                                    </span>
                                    <span className="truncate">
                                        <HighlightedName name={action.room.name} highlights={action.highlights} />
                                    </span>
                                </li>
                            );
                        }

                        if (action.kind === 'join') {
                            return (
                                <li key="__join" className={rowClass}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    onClick={() => activate(action)}
                                >
                                    <span className="w-4 flex justify-center text-green-500">
                                        <FontAwesomeIcon icon={faArrowRightToBracket} />
                                    </span>
                                    <span>Join <span className="font-semibold">{action.query}</span></span>
                                </li>
                            );
                        }

                        if (action.kind === 'pm') {
                            return (
                                <li key="__pm" className={rowClass}
                                    onMouseEnter={() => setSelectedIndex(i)}
                                    onClick={() => activate(action)}
                                >
                                    <span className="w-4 flex justify-center text-blue-300">
                                        <FontAwesomeIcon icon={faUser} />
                                    </span>
                                    <span>Message <span className="font-semibold">{action.query}</span></span>
                                </li>
                            );
                        }

                        return (
                            <li key={`__settings-${action.section}`} className={rowClass}
                                onMouseEnter={() => setSelectedIndex(i)}
                                onClick={() => activate(action)}
                            >
                                <span className="w-4 flex justify-center text-gray-175">
                                    <FontAwesomeIcon icon={faCog} />
                                </span>
                                <span>Settings: <span className="font-semibold">{action.section}</span></span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
