import './utils/showdown-globals';
import ReactDOM from 'react-dom/client';
import App from './UI/App';
import { StrictMode } from 'react';
import { client } from './client/client';

import '@fontsource/roboto-mono';
import './UI/globals.css';
import ClientContextProvider from './UI/components/single/ClientContext';
import { Analytics } from '@vercel/analytics/react';
import { ErrorBoundary } from './UI/components/ErrorBoundary';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);

client.start();
window.client = client; // Expose the client globally for debugging purposes

root.render(
    <StrictMode>
        <ErrorBoundary>
            <Analytics/>
            <ClientContextProvider>
                <App />
            </ClientContextProvider>
        </ErrorBoundary>
    </StrictMode>,
);
