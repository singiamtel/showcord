import Rooms from "./rooms";
import Users from "./users";
import UserPanel from "./userpanel";
import BigPanel from "./BigPanel";

export default function Home() {
  return (
    <div className="h-full flex bg-gray-300 w-full">
      {/* JSX comment*/}
      <div className="w-1/6 flex-col flex">
        <Rooms className="flex-grow" />
        <UserPanel />
      </div>
          <BigPanel />
      <div className="w-1/6">
        <Users />
      </div>
      <div id="modal-root"></div>
    </div>
  );
}
