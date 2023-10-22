import ReactDOM from 'react-dom/client';
import Home from './app/Home';
import { StrictMode } from 'react';

import '@fontsource/roboto-mono';
import './app/globals.css';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);
root.render(
    <StrictMode>
        <Home />
    </StrictMode>,
);
