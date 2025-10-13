import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import path from 'path';

export default defineConfig(({ command }) => ({
    base: `${process.env.PUBLIC_URL ?? ''}/`,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            events: 'rollup-plugin-node-polyfills/polyfills/events',
        },
    },
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./test/setupTests.js'],
        reporters: 'basic',
    },
}));
