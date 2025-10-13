import { useContext } from 'react';
import { TrainerCardContext } from './TrainerCardContext.types';

export const useTrainerCard = () => {
    const context = useContext(TrainerCardContext);
    if (context === undefined) {
        throw new Error('useTrainerCard must be used within a TrainerCardProvider');
    }
    return context;
};
