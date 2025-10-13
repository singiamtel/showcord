import { create } from 'zustand';

interface AppStoreState {
    theme: 'light' | 'dark' | 'system';
    error: string | undefined;
    isConnected: boolean;
}

interface AppStoreActions {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setError: (error: string | undefined) => void;
    setConnected: (connected: boolean) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>((set) => ({
    theme: localStorage.getItem('theme') as 'light' | 'dark' | 'system' ?? 'system',
    error: undefined,
    isConnected: false,

    setTheme: (theme: 'light' | 'dark' | 'system') => {
        set(() => ({ theme }));
    },

    setError: (error: string | undefined) => {
        set(() => ({ error }));
    },

    setConnected: (isConnected: boolean) => {
        set(() => ({ isConnected }));
    },
}));
