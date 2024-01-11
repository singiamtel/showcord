import ReactDOM from 'react-dom/client';
import App from './UI/App';
import { StrictMode } from 'react';

import '@fontsource/roboto-mono';
import './UI/globals.css';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);

root.render(
    <StrictMode>
        <App />
    </StrictMode>,
);
