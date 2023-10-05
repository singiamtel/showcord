import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ command }) => {
    const config = {
        base: `${process.env.PUBLIC_URL ?? ''}/`,
    };

    if (command === 'build') {
        return {
            ...config,
            esbuild: {
                jsxInject: 'import React from "react";',
            },
        };
    } else {
        return {
            ...config,
            // plugins: [react()],
            plugins: [react()],
            // swc options
        };
    }
});
