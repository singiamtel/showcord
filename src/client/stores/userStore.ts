import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface UserStoreState {
    user: string | undefined;
    avatar: string;
    challstr: string;
}

interface UserStoreActions {
    setUser: (user: string | undefined) => void;
    setAvatar: (avatar: string) => void;
    setChallstr: (challstr: string) => void;
}

export type UserStore = UserStoreState & UserStoreActions;

export const useUserStore = create<UserStore>()(
    immer((set) => ({
        user: undefined,
        avatar: 'lucas',
        challstr: '',

        setUser: (user: string | undefined) => {
            set({ user });
        },

        setAvatar: (avatar: string) => {
            set({ avatar });
        },

        setChallstr: (challstr: string) => {
            set({ challstr });
        },
    }))
);
