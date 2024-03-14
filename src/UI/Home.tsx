import {
    createRef,
    FormEvent,
    HTMLAttributes,
    KeyboardEventHandler,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { PS_context } from './components/single/PS_context';
import RoomCard from './components/RoomCard';
import { InfinitySpin } from 'react-loader-spinner';
import MiniSearch, { SearchResult } from 'minisearch';
import NewsCard from './components/NewsCard';

import targetFaceCluster from './assets/cluster_target_face_nobg.webp';

import github from './assets/github.png';
import discord from './assets/discord.png';
import FAQ from './assets/FAQ.png';

import { twMerge } from 'tailwind-merge';

const minisearch = new MiniSearch({
    fields: ['title', 'desc'],
    storeFields: ['title', 'desc', 'userCount', 'section'],
    idField: 'title',
});

function TargetFaceWelcome({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={twMerge(
                'rounded-lg flex flex-col justify-center items-center overflow-hidden relative',
                className,
            )}
        >
            <img
                src={targetFaceCluster}
                alt="targetFaceCluster"
                className="opacity-70 h-auto w-full"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black z-10 bg-gray-100 dark:bg-gray-600 opacity-10" />
            <div className="flex flex-col justify-between p-4 absolute">
                <h1 className="font-bold text-4xl text-center z-10 text-transparent">
          Welcome to Showcord!
                </h1>
                <h2 className="font-bold text-2xl text-center z-10 text-transparent">
          Chat with your friends and meet new people
                </h2>
            </div>
        </div>
    );
}

function News({ className }: Readonly<{ className?: string }>) {
    const [news, setNews] = useState<any[]>([]);
    const { client } = useContext(PS_context);
    useEffect(() => {
        if (!client) return;
        client.queryNews(setNews);
    }, [client]);
    return (
        <div
            className={twMerge(
                'p-4 rounded-lg flex flex-col overflow-y-auto',
                className,
            )}
        >
            <h2 className="font-bold text-xl text-center mt-2">
        Latest News
            </h2>
            {news?.slice(0, -1).map((n, idx) => (
                <NewsCard key={idx} news={n} last={idx === news.length - 2} />
            ))}
        </div>
    );
}

function RoomList({ className }: Readonly<{ className?: string }>) {
    const { client } = useContext(PS_context);
    const [roomsJSON, setRoomsJSON] = useState<any>({});
    const [input, setInput] = useState<string>('');
    const [miniSearchResults, setMiniSearchResults] = useState<SearchResult[]>(
        [],
    );
    const { setRoom } = useContext(PS_context);

    const formRef = createRef<HTMLFormElement>();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!client) return;
        client.queryRooms(setRoomsJSON);
    }, [client]);

    useEffect(() => {
        if (!roomsJSON?.chat) return;
        minisearch.removeAll();
        minisearch.addAll(roomsJSON.chat);
    }, [roomsJSON]);

    useEffect(() => {
        const search = minisearch.search(input, {
            fuzzy: 0.2,
            prefix: true,
        });
        setMiniSearchResults(search);
    }, [input, setMiniSearchResults]);

    useEffect(() => {
        const focus = () => {
            inputRef.current?.focus();
        };
        focus();
        window.addEventListener('focus', focus);
        return () => {
            window.removeEventListener('focus', focus);
        };
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
            if (!formRef.current?.textContent) {
                setRoom(1);
                e.preventDefault();
                return;
            }
        }
        if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowLeft') {
            if (!formRef.current?.textContent) {
                setRoom(-1);
                e.preventDefault();
                return;
            }
        }
    };
    return (
        <div className={twMerge('p-4 rounded-lg overflow-y-auto max-h-[70vh] md:max-h-full', className)}>
            <h2 className="font-bold text-xl text-center">
        Rooms
            </h2>
            <span className="m-2 block">
        Find a chatroom for your favourite metagame or hobby!
                <form
                    ref={formRef}
                    onSubmit={onSubmit}
                >
                    <input
                        value={input}
                        ref={inputRef}
                        onKeyDown={onKeyDown}
                        onChange={(e) => {
                            setInput(e.target.value);
                        }}
                        className="w-full rounded my-1 p-2 placeholder-gray-175 bg-gray-376 dark:bg-gray-375"
                        placeholder="Search for a room"
                    />
                </form>
                <small className="text-gray-125 mb-4">
          Pressing enter will try to join the room.
                </small>

                <hr />
            </span>

            {miniSearchResults.length > 0 ?
                miniSearchResults?.sort((a: any, b: any) => b.userCount - a.userCount)
                    .map((room: any, idx: number) => (
                        <RoomCard onClick={manageRoomCardClick} key={idx} room={room} />
                    )) :
                roomsJSON ?
                    roomsJSON.chat?.sort((a: any, b: any) => b.userCount - a.userCount)
                        .map((room: any, idx: number) => (
                            <RoomCard onClick={manageRoomCardClick} key={idx} room={room} />
                        )) :
                    (
                        <div className="h-full flex items-center justify-center !bg-white">
                            <InfinitySpin
                                width="200"
                                color="#4fa94d"
                            />
                        </div>
                    )}
        </div>
    );
}

function SocialLink({ id, href, children }: { id: string, href?: string, children: any }) {
    const [matches, setMatches] = useState(
        window.matchMedia('(min-width: 1500px)').matches
    );
    useEffect(() => {
        window
            .matchMedia('(min-width: 1500px)')
            .addEventListener('change', e => setMatches(e.matches));
    }, []);
    return (
        <a
            id={id}
            className="max-h-full min-h-0 flex items-center gap-2 w-full p-8 rounded-lg cursor-pointer text-black visited:text-black dark:text-white dark:hover:text-white dark:visited:text-white overflow-ellipsis hover-color bg-gray-251 dark:bg-gray-300 "
            target="_blank"
            href={href}
        >
            {matches ? children : <div className="flex justify-center items-center w-full">{children[0]}</div>}
        </a>
    );
}

function SocialLinks({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={twMerge(
                'p-4 rounded text-white flex items-center justify-center flex-col gap-2 text-sm ',
                className,
            )}
        >
            <SocialLink
                id="discord"
                href="https://discord.gg/kxNdKdWxW2"
            >
                <img
                    src={discord}
                    alt="discord"
                    height="50"
                    width="50"
                />
                <p className="text-center ">
            Found a bug or want to give us feedback? Join our Discord
            community to share your thoughts!
                </p>
            </SocialLink>
            <SocialLink
                id="github"
                href="https://github.com/singiamtel/Showcord"
            >
                <img
                    src={github}
                    alt="github"
                    height="50"
                    width="50"
                />
                <span>
                    <p>
              All of our code is open source and available on GitHub. Contribute,
              explore, and help us evolve!
                    </p>
                </span>
            </SocialLink>
            <SocialLink
                id="FAQ"
                // href="https://github.com/singiamtel/Showcord"
            >
                <img
                    src={FAQ}
                    alt="FAQ"
                    height="50"
                    width="50"
                />
                <span>
                    <p>
            Frequently asked questions
                    </p>
                </span>
            </SocialLink>
            <div id="links">
            </div>
        </div>
    );
}

export default function Home(props: Readonly<HTMLAttributes<'div'>>) {
    return (
        <div
            className={twMerge(
                'flex flex-col flex-grow md:grid md:grid-cols-8 md:grid-rows-2 gap-6 p-4 [&>*]:bg-gray-100 dark:[&>*]:bg-gray-600 overflow-y-scroll h-full',
                props.className,
            )}
        >
            <News className="md:col-span-5 row-span-1 col-span-8 order-3 md:order-none" />
            <RoomList className="md:col-span-3 row-span-2 col-span-8 order-2 md:order-none" />
            <TargetFaceWelcome className="md:col-span-3 row-span-1 col-span-8 order-1 md:order-none" />
            <SocialLinks className="md:col-span-2 row-span-1 col-span-8 order-4 md:order-none" />
        </div>
    );
}

// {"chat":[{"title":"Lobby","desc":"Still haven't decided on a room for you? Relax here amidst the chaos.","userCount":626,"section":"Official"},
