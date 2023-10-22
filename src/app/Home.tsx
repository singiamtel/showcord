import Sidebar from './sidebar';
import BigPanel from './BigPanel';
import ToastProvider from './ToastProvider';
import PS_contextProvider from './PS_context';

export default function Home() {
    return (
        <PS_contextProvider>
            <ToastProvider>
                <div className="grid grid-cols-7 grid-rows-1 h-screen bg-gray-300 w-screen">
                    <Sidebar className='col-span-1'/>
                    <BigPanel className='col-span-6'/>
                </div>
            </ToastProvider>
        </PS_contextProvider>
    );
}
