import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import path from 'path';

export default defineConfig(({ command }) => {
    const config = {
        base: `${process.env.PUBLIC_URL ?? ''}/`,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                events: 'rollup-plugin-node-polyfills/polyfills/events',
            },
        },
    };

    if (command === 'build') {
        return {
            ...config,
            esbuild: {
                // jsxInject: 'import React from "react";',
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
