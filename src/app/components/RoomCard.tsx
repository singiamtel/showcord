export type RoomQuery = {
  title: string;
  desc: string;
  userCount: number;
  section: string;
};

// blue 100 green 200
const emoji: {[key:string]: string} = {
  Official: "📣",
  Languages: "📖",
  "Life & Hobbies": "🎨",
  "Battle formats": "🔥",
  Gaming: "🎮",
  Entertainment: "🎬",
  "On-site games": "🎲",
}

export default function RoomCard({ room }: { room: RoomQuery }) {
  return (
    <button
      className={"rounded-lg m-2 my-2 p-2 bg-gray-300 hover:bg-gray-175 text-left w-full"}
    >
      <h3 className="font-bold text-blue-300">{emoji[room.section] || null} {room.title} {room.section} </h3>
      <small className="block text-gray-100"> {room.userCount} users</small>
      {room.desc}
    </button>
  );
      // {room.userCount}
      // {room.section}
}
