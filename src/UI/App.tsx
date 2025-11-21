import { library } from '@fortawesome/fontawesome-svg-core';
import { faBarChart, faPieChart } from '@fortawesome/free-solid-svg-icons';

import Sidebar from './components/single/Sidebar';
import BigPanel from './components/single/BigPanel';
import { TrainerCardProvider } from './components/single/TrainerCard/TrainerCardContext';
import { useAppStore } from '@/client/client';
import { Toaster } from '@/components/ui/toaster';
import { useMediaQuery } from './hooks/useMediaQuery';

library.add(faBarChart, faPieChart);

export default function App() {
    const theme = useAppStore(state => state.theme);
    const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');

    const isDark = theme === 'system' ? systemPrefersDark : theme === 'dark';

    return (
        <div className={`${isDark ? 'dark' : ''}`}>
            <div
                className={`grid grid-cols-7 grid-rows-1 md:h-screen text-text dark:text-text-dark dark:bg-gray-300 w-screen dark:[color-scheme:dark]`}
            >
                <TrainerCardProvider>
                    <Sidebar className="md:col-span-1 col-span-7 hidden md:flex" />
                    <BigPanel className="md:col-span-6 col-span-7" />
                </TrainerCardProvider>
            </div>
            <Toaster />
        </div>
    );
}
