import {
    type FormEvent,
    type HTMLAttributes,
    type KeyboardEventHandler,
    useEffect,
    useRef,
    useState,
} from 'react';
import RoomCard from './components/RoomCard';
import { InfinitySpin } from 'react-loader-spinner';
import MiniSearch from 'minisearch';
import NewsCard from './components/NewsCard';
import { Sprites } from '@pkmn/img';
import { Username } from './components/Username';
import { rankOrder } from '@/client/user';
import { motion } from 'framer-motion';

import targetFaceCluster from './assets/cluster_target_face_nobg.webp';
import github from './assets/github.png';
import discord from './assets/discord.png';
import FAQ from './assets/FAQ.png';

import { twMerge } from 'tailwind-merge';
import { useClientContext } from './components/single/useClientContext';

const minisearch = new MiniSearch({
    fields: ['title', 'desc'],
    storeFields: ['title', 'desc', 'userCount', 'section'],
    idField: 'title',
});

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const },
    }),
};

function GettingStarted() {
    const [visible, setVisible] = useState(() => {
        try { return !localStorage.getItem('showcord_welcomed'); }
        catch { return true; }
    });

    const dismiss = () => {
        setVisible(false);
        try { localStorage.setItem('showcord_welcomed', '1'); } catch { /* ignore */ }
    };

    if (!visible) return null;

    return (
        <motion.div
            className="shrink-0 rounded-xl bg-blue-300/10 dark:bg-blue-300/5 border border-blue-300/20 dark:border-blue-300/10 px-4 py-3 flex items-start gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
        >
            <span className="text-base shrink-0 mt-0.5">👋</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-600 dark:text-white mb-1">
                    New to Showcord?
                </p>
                <ol className="text-xs text-gray-125 dark:text-gray-100 space-y-0.5 list-none">
                    <li><span className="text-blue-300 font-bold mr-1">1.</span><strong className="text-gray-600 dark:text-white font-medium">Log in</strong> with your Pokemon Showdown account using the sidebar</li>
                    <li><span className="text-blue-300 font-bold mr-1">2.</span>Use <strong className="text-gray-600 dark:text-white font-medium">Battle</strong> in the sidebar to fight or spectate</li>
                    <li><span className="text-blue-300 font-bold mr-1">3.</span>Click a <strong className="text-gray-600 dark:text-white font-medium">Room</strong> to join the chat</li>
                    <li><span className="text-blue-300 font-bold mr-1">4.</span><strong className="text-gray-600 dark:text-white font-medium">Find User</strong> to look up any PS player</li>
                </ol>
            </div>
            <button
                onClick={dismiss}
                className="shrink-0 text-gray-175 hover:text-gray-125 dark:text-gray-100 dark:hover:text-white transition-colors text-lg leading-none mt-0.5 cursor-pointer"
                aria-label="Dismiss"
            >
                ×
            </button>
        </motion.div>
    );
}

function SectionLabel({ children }: Readonly<{ children: string }>) {
    return (
        <div className="flex items-center gap-2.5 mb-3 shrink-0">
            <span className="block w-0.5 h-4 rounded-full bg-blue-300 shrink-0" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-125 select-none">
                {children}
            </h2>
        </div>
    );
}

function Hero() {
    return (
        <motion.div
            className="relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-600 shrink-0"
            style={{ minHeight: '160px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-300/15 via-blue-300/5 to-transparent dark:from-blue-300/10 dark:via-transparent pointer-events-none" />
            <img
                src={targetFaceCluster}
                alt="Showcord Mascot"
                className="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-80 dark:opacity-60 pointer-events-none select-none"
            />
            <div className="relative z-10 flex flex-col justify-center h-full px-8 py-8 max-w-xs md:max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-1">
                    Pokemon Showdown client
                </p>
                <h1 className="font-black text-3xl leading-tight text-gray-600 dark:text-white">
                    Welcome to<br />
                    <span className="text-blue-300">Showcord</span>
                </h1>
                <p className="mt-2 text-sm text-gray-125 leading-relaxed">
                    Chat with friends &amp; discover new people
                </p>
            </div>
        </motion.div>
    );
}

function News({ className }: Readonly<{ className?: string }>) {
    const [news, setNews] = useState<any[]>([]);
    const { client } = useClientContext();

    useEffect(() => {
        if (!client) return;
        client.queryNews().then(setNews);
    }, [client]);

    return (
        <div className={twMerge('flex flex-col min-h-0 p-4 rounded-xl bg-gray-100 dark:bg-gray-600', className)}>
            <SectionLabel>Latest News</SectionLabel>
            <div className="overflow-y-auto flex-1 min-h-0 -mr-1 pr-1">
                {news?.slice(0, -1).map((n) => (
                    <NewsCard key={n.id || n.title} news={n} last={n === news[news.length - 2]} />
                ))}
                {news.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                        <InfinitySpin width="120" color="#4fa94d" />
                    </div>
                )}
            </div>
        </div>
    );
}

function RoomList({ className }: Readonly<{ className?: string }>) {
    const { client, setRoom } = useClientContext();
    const [roomsJSON, setRoomsJSON] = useState<any>({});
    const [input, setInput] = useState<string>('');

    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!client) return;
        client.queryRooms().then(setRoomsJSON);
    }, [client]);

    useEffect(() => {
        if (!roomsJSON?.chat) return;
        minisearch.removeAll();
        minisearch.addAll(roomsJSON.chat);
    }, [roomsJSON]);

    const miniSearchResults = input ?
        minisearch.search(input, { fuzzy: 0.2, prefix: true }) :
        [];

    useEffect(() => {
        const focus = () => { inputRef.current?.focus(); };
        focus();
        window.addEventListener('focus', focus);
        return () => { window.removeEventListener('focus', focus); };
    }, []);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!client) return;
        client.join(input);
        setInput('');
    };

    const manageRoomCardClick = (str: string) => {
        if (!client) return;
        client.join(str);
    };

    const onKeyDown: KeyboardEventHandler = (e: any) => {
        if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight') {
            if (!formRef.current?.textContent) { setRoom(1); e.preventDefault(); return; }
        }
        if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowLeft') {
            if (!formRef.current?.textContent) { setRoom(-1); e.preventDefault(); return; }
        }
    };

    const rooms = miniSearchResults.length > 0
        ? miniSearchResults.sort((a: any, b: any) => b.userCount - a.userCount)
        : roomsJSON?.chat?.sort((a: any, b: any) => b.userCount - a.userCount) ?? [];

    return (
        <div className={twMerge('flex flex-col min-h-0 p-4 rounded-xl bg-gray-100 dark:bg-gray-600', className)}>
            <SectionLabel>Rooms</SectionLabel>
            <form ref={formRef} onSubmit={onSubmit} className="shrink-0">
                <input
                    value={input}
                    ref={inputRef}
                    onKeyDown={onKeyDown}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm placeholder-gray-175 bg-gray-376 dark:bg-gray-375 focus:outline-none focus:ring-1 focus:ring-blue-300/60 transition-shadow"
                    placeholder="Search or join a room…"
                />
            </form>
            <p className="text-xs text-gray-125 mt-1 mb-3 shrink-0">
                Press <kbd className="px-1 py-0.5 rounded bg-gray-251 dark:bg-gray-300 text-[10px] font-mono">↵</kbd> to join directly.
            </p>
            <div className="overflow-y-auto flex-1 min-h-0 -mr-1 pr-1">
                {!roomsJSON.chat && (
                    <div className="flex items-center justify-center h-full">
                        <InfinitySpin width="200" color="#4fa94d" />
                    </div>
                )}
                {rooms.map((room: any, idx: number) => (
                    <RoomCard onClick={manageRoomCardClick} key={room.title} room={room} index={idx} />
                ))}
            </div>
        </div>
    );
}

function UserSearch({ className }: Readonly<{ className?: string }>) {
    const { client, setRoom } = useClientContext();
    const [input, setInput] = useState('');
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!client || !trimmed) return;
        setLoading(true);
        setError(null);
        setUser(null);
        client.queryUser(trimmed)
            .then((result: any) => {
                if (result?.userid) setUser(result);
                else setError('User not found');
            })
            .catch(() => setError('Failed to search for user'))
            .finally(() => setLoading(false));
    };

    const onKeyDown: KeyboardEventHandler = (e: any) => {
        if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight') {
            if (!formRef.current?.textContent) { setRoom(1); e.preventDefault(); }
        }
        if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowLeft') {
            if (!formRef.current?.textContent) { setRoom(-1); e.preventDefault(); }
        }
    };

    const rooms = user?.rooms ? Object.entries(user.rooms) : [];

    return (
        <div className={twMerge('p-4 rounded-xl bg-gray-100 dark:bg-gray-600', className)}>
            <SectionLabel>Find User</SectionLabel>
            <form ref={formRef} onSubmit={onSubmit}>
                <input
                    value={input}
                    ref={inputRef}
                    onKeyDown={onKeyDown}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm placeholder-gray-175 bg-gray-376 dark:bg-gray-375 focus:outline-none focus:ring-1 focus:ring-blue-300/60 transition-shadow"
                    placeholder="PS username…"
                />
            </form>

            {loading && (
                <div className="flex justify-center pt-3">
                    <InfinitySpin width="80" color="#4fa94d" />
                </div>
            )}
            {error && (
                <p className="text-red-500 text-xs text-center mt-2">{error}</p>
            )}
            {user && (
                <motion.div
                    className="mt-3 p-3 rounded-lg bg-gray-251 dark:bg-gray-500"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-251 dark:bg-gray-250 border border-gray-351 dark:border-gray-700">
                            <img
                                src={user.avatar ? Sprites.getAvatar(user.avatar) : Sprites.getAvatar(167)}
                                className="w-10 h-10 object-cover m-auto scale-[1.2]"
                                alt="avatar"
                            />
                        </div>
                        <div className="min-w-0">
                            <Username user={user.name || ` ${user.userid}`} bold />
                            {user.status && (
                                <p className="text-xs text-gray-125 dark:text-gray-100 mt-0.5 truncate">
                                    {user.status.startsWith('!') ? user.status.slice(1) : user.status}
                                </p>
                            )}
                        </div>
                    </div>
                    {rooms.length > 0 && (
                        <div className="text-xs mt-3 text-gray-125 dark:text-gray-100 leading-relaxed">
                            <span className="font-semibold text-gray-600 dark:text-white">Rooms: </span>
                            {rooms.map(([room, _]: [string, any], idx: number) => {
                                const firstChar = room.charAt(0);
                                const hasRank = rankOrder[firstChar as keyof typeof rankOrder] !== undefined;
                                return (
                                    <span key={room}>
                                        {hasRank && (
                                            <span className="text-[#9D9488] font-mono">{firstChar}</span>
                                        )}
                                        {hasRank ? room.slice(1) : room}
                                        {idx < rooms.length - 1 ? ', ' : ''}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

function SocialLinks({ className }: Readonly<{ className?: string }>) {
    const links = [
        {
            id: 'discord',
            href: 'https://discord.gg/kxNdKdWxW2',
            src: discord,
            alt: 'Discord',
            label: 'Discord',
        },
        {
            id: 'github',
            href: 'https://github.com/singiamtel/Showcord',
            src: github,
            alt: 'GitHub',
            label: 'GitHub',
        },
        {
            id: 'faq',
            href: 'https://github.com/singiamtel/Showcord#readme',
            src: FAQ,
            alt: 'FAQ',
            label: 'FAQ',
        },
    ];

    return (
        <div className={twMerge('p-4 rounded-xl bg-gray-100 dark:bg-gray-600', className)}>
            <SectionLabel>Community</SectionLabel>
            <div className="flex gap-2">
                {links.map(({ id, href, src, alt, label }) => (
                    <a
                        key={id}
                        id={id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg bg-gray-251 dark:bg-gray-300 hover:bg-gray-351 dark:hover:bg-gray-175 transition-colors cursor-pointer text-gray-600 dark:text-white visited:text-gray-600 dark:visited:text-white"
                    >
                        <img src={src} alt={alt} width="24" height="24" className="opacity-80" />
                        <span className="text-xs font-medium text-gray-125">{label}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}

export default function Home(props: Readonly<HTMLAttributes<'div'>>) {
    return (
        <div
            className={twMerge(
                'relative flex flex-col gap-4 p-4 h-full overflow-y-auto md:overflow-hidden',
                props.className,
            )}
        >
            <img
                src={targetFaceCluster}
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none absolute bottom-0 right-0 w-[55%] max-w-2xl opacity-[0.04] dark:opacity-[0.06] object-contain object-bottom z-0"
            />
            <div className="relative z-10"><Hero /></div>

            {/* Desktop: 3-column bento grid. Mobile: stacked. */}
            <div className="relative z-10 flex flex-col md:grid md:grid-cols-12 gap-4 flex-1 md:min-h-0">
                {/* News — 4 cols */}
                <motion.div
                    className="md:col-span-4 flex flex-col md:min-h-0 max-h-[60vh] md:max-h-full order-4 md:order-none gap-4"
                    custom={1}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <GettingStarted />
                    <News className="flex-1 md:min-h-0" />
                </motion.div>

                {/* Rooms — 5 cols */}
                <motion.div
                    className="md:col-span-5 flex flex-col md:min-h-0 max-h-[70vh] md:max-h-full order-1 md:order-none"
                    custom={2}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <RoomList className="flex-1 md:min-h-0" />
                </motion.div>

                {/* Right sidebar — 3 cols: UserSearch + SocialLinks */}
                <motion.div
                    className="md:col-span-3 flex flex-col gap-4 md:min-h-0 order-2 md:order-none"
                    custom={3}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                >
                    <UserSearch />
                    <SocialLinks />
                </motion.div>
            </div>
        </div>
    );
}
