import Sidebar from "./sidebar";
import BigPanel from "./BigPanel";
import ToastProvider from "./ToastProvider";
import PS_contextProvider from "./PS_context";

export default function Home() {
  return (
    <div className="h-full flex bg-gray-300 w-full">
      <PS_contextProvider>
        <ToastProvider>
          <Sidebar />
          <BigPanel />
        </ToastProvider>
      </PS_contextProvider>
    </div>
  );
}
