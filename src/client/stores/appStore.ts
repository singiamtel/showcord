import { create } from 'zustand';

interface AppStoreState {
    theme: 'light' | 'dark' | 'system';
    error: string | undefined;
}

interface AppStoreActions {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setError: (error: string | undefined) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>((set) => ({
    theme: localStorage.getItem('theme') as 'light' | 'dark' | 'system' ?? 'system',
    error: undefined,

    setTheme: (theme: 'light' | 'dark' | 'system') => {
        set(() => ({ theme }));
    },

    setError: (error: string | undefined) => {
        set(() => ({ error }));
    },
}));
