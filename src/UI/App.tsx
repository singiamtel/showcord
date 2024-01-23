import Sidebar from './components/single/sidebar';
import BigPanel from './components/single/BigPanel';
import ToastProvider from './components/single/ToastProvider';
import { PS_context } from './components/single/PS_context';
import { useContext } from 'react';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faBarChart, faPieChart } from '@fortawesome/free-solid-svg-icons';

library.add(faBarChart, faPieChart);

export default function App() {
    const { client } = useContext(PS_context);
    return (
        <div className={`${client.settings.getTheme() === 'dark' ? 'dark' : ''}`}>
            <ToastProvider>
                <div
                    className={`grid grid-cols-7 grid-rows-1 h-screen text-black dark:text-white dark:bg-gray-300 w-screen dark:[color-scheme:dark]`}
                >
                    <Sidebar className="col-span-1" />
                    <BigPanel className="col-span-6" />
                </div>
            </ToastProvider>
        </div>
    );
}
