import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ command }) => {
    const config = {
        base: `${process.env.PUBLIC_URL ?? ''}/`,
        build: {
            sourcemap: true, // Source map generation must be turned on
        },
        plugins: [
            // Put the Sentry vite plugin after all other plugins
            sentryVitePlugin({
                authToken: process.env.SENTRY_AUTH_TOKEN,
                org: 'na-q9f',
                project: 'javascript-react',
            }),
        ],
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
            plugins: [react(), ...config.plugins],
            // swc options
        };
    }
});
