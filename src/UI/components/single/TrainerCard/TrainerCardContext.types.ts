import { createContext } from 'react';

export interface TrainerCardContextType {
    isOpen: boolean;
    openCard: () => void;
    closeCard: () => void;
    clickUsername: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export const TrainerCardContext = createContext<TrainerCardContextType | undefined>(undefined);
