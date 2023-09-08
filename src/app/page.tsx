import Sidebar from "./sidebar";
import Users from "./users";
import BigPanel from "./BigPanel";

export default function Home() {
  return (
    <div className="h-full flex bg-gray-300 w-full">
      {/* JSX comment*/}
        <Sidebar />
          <BigPanel />
      <div className="w-1/6">
        <Users />
      </div>
      <div id="modal-root"></div>
    </div>
  );
}
