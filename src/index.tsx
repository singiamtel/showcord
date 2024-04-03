import ReactDOM from 'react-dom/client';
import App from './UI/App';
import { StrictMode } from 'react';

import '@fontsource/roboto-mono';
import './UI/globals.css';
import ClientContextProvider from './UI/components/single/ClientContext';
import { Analytics } from '@vercel/analytics/react';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);

root.render(
    <StrictMode>
        <Analytics/>
        <ClientContextProvider>
            <App />
        </ClientContextProvider>
    </StrictMode>,
);
