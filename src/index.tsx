import ReactDOM from 'react-dom/client';
import App from './UI/App';
import { StrictMode } from 'react';
import { client } from './client/singleton';

import '@fontsource/roboto-mono/latin-400.css';
import './UI/globals.css';
import ClientContextProvider from './UI/components/single/ClientContext';
import { Analytics } from '@vercel/analytics/react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorHandler } from './UI/components/ErrorHandler';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);

client.start();
window.client = client; // Expose the client globally for debugging purposes

root.render(
    <StrictMode>
        <ErrorBoundary FallbackComponent={ErrorHandler}>
            <Analytics/>
            <ClientContextProvider>
                <App />
            </ClientContextProvider>
        </ErrorBoundary>
    </StrictMode>,
);
