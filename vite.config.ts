import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ command }) => {
    const config = {
        base: `${process.env.PUBLIC_URL ?? ''}/`,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
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
