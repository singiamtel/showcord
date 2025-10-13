import { useContext } from 'react';
import { ClientContext } from './ClientContext.types';

export function useClientContext() {
    const context = useContext(ClientContext);
    if (!context) {
        throw new Error('useClientContext must be used within a ClientContextProvider');
    }
    return context;
}

useClientContext.displayName = 'useClientContext';
