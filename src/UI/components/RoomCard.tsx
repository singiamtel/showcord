export type RoomQuery = {
    title: string;
    desc: string;
    userCount: number;
    section: string;
};

// blue 100 green 200
const emoji: { [key: string]: string } = {
    Official: '📣',
    Languages: '📖',
    'Life & Hobbies': '🎨',
    'Battle formats': '🔥',
    Gaming: '🎮',
    Entertainment: '🎬',
    'On-site games': '🎲',
};

export default function RoomCard(
    { room, onClick }: { room: RoomQuery; onClick: (str: string) => void },
) {
    return (
        <button
            className={'rounded-lg mr-2 my-2 p-2 bg-gray-251 dark:bg-gray-300 hover:bg-gray-351 dark:hover:bg-gray-175 text-left w-full'}
            onClick={(e) => {
                e.preventDefault();
                onClick(room.title);
            }}
        >
            <span className="text-gray-125">
                <h3 className="font-bold text-blue-300">
                    {emoji[room.section] || null} &nbsp;{room.title}
                </h3>
                <small className="inline text-gray-125">{room.section ? `${room.section} - ` : null} {room.userCount} users</small>
            </span>
            <div>
                {room.desc}
            </div>
        </button>
    );
}
