import { library } from '@fortawesome/fontawesome-svg-core';
import { faBarChart, faPieChart } from '@fortawesome/free-solid-svg-icons';

import Sidebar from './components/single/Sidebar';
import BigPanel from './components/single/BigPanel';
import ToastProvider from './components/single/ToastProvider';
import { TrainerCardProvider } from './components/single/TrainerCard/TrainerCardContext';
import { client } from './components/single/ClientContext';

library.add(faBarChart, faPieChart);

export default function App() {
    return (
        <div className={`${client.settings.getTheme() === 'dark' ? 'dark' : ''}`}>
            <ToastProvider>
                <TrainerCardProvider>
                    <div
                        className={`grid grid-cols-7 grid-rows-1 md:h-screen text-black dark:text-white dark:bg-gray-300 w-screen dark:[color-scheme:dark]`}
                    >
                        <Sidebar className="md:col-span-1 col-span-7 hidden md:flex" />
                        <BigPanel className="md:col-span-6 col-span-7" />
                    </div>
                </TrainerCardProvider>
            </ToastProvider>
        </div>
    );
}
