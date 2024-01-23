import ReactDOM from 'react-dom/client';
import App from './UI/App';
import { StrictMode } from 'react';

import '@fontsource/roboto-mono';
import './UI/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import PS_contextProvider from './UI/components/single/PS_context';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);

root.render(
    <StrictMode>
        <PS_contextProvider>
            <App />
        </PS_contextProvider>
    </StrictMode>,
);
