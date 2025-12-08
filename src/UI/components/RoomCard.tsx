import { motion } from 'framer-motion';

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
} as const;

export default function RoomCard(
    { room, onClick, index = 0 }: Readonly<{ room: RoomQuery; onClick: (str: string) => void; index?: number }>,
) {
    return (
        <motion.button
            type="button"
            className={'rounded-lg mr-2 my-2 p-2 bg-gray-251 dark:bg-gray-300 hover:bg-gray-351 dark:hover:bg-gray-175 text-left w-full transition-colors'}
            onClick={(e) => {
                e.preventDefault();
                onClick(room.title);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.03,
            }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
        >
            <span className="text-gray-125">
                <h3 className="font-bold text-blue-300">
                    {emoji[room.section] || null} &nbsp;{room.title}
                </h3>
                <small className="inline text-gray-125">{room.section ? `${room.section} - ` : null} {room.userCount} user{room.userCount === 1 ? '' : 's'}</small>
            </span>
            <div>
                {room.desc}
            </div>
        </motion.button>
    );
}
