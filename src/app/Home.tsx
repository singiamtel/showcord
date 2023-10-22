import Sidebar from './sidebar';
import BigPanel from './BigPanel';
import ToastProvider from './ToastProvider';
import PS_contextProvider from './PS_context';

export default function Home() {
    return (
        <PS_contextProvider>
            <ToastProvider>
                <div className="h-full flex bg-gray-300 w-full">
                    <Sidebar />
                    <BigPanel />
                </div>
            </ToastProvider>
        </PS_contextProvider>
    );
}
