import { library } from '@fortawesome/fontawesome-svg-core';
import { faBarChart, faPieChart } from '@fortawesome/free-solid-svg-icons';

import Sidebar from './components/single/Sidebar';
import BigPanel from './components/single/BigPanel';
import ToastProvider from './components/single/ToastProvider';
import { TrainerCardProvider } from './components/single/TrainerCard/TrainerCardContext';
import { useClientStore } from '@/client/client';

library.add(faBarChart, faPieChart);

export default function App() {
    const theme = useClientStore(state => state.theme);
    return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
            <ToastProvider>
                <div
                    className={`grid grid-cols-7 grid-rows-1 md:h-screen text-text dark:text-text-dark dark:bg-gray-300 w-screen dark:[color-scheme:dark]`}
                >
                    <TrainerCardProvider>
                        <Sidebar className="md:col-span-1 col-span-7 hidden md:flex" />
                        <BigPanel className="md:col-span-6 col-span-7" />
                    </TrainerCardProvider>
                </div>
            </ToastProvider>
        </div>
    );
}
