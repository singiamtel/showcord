import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => ({
    base: `${process.env.PUBLIC_URL ?? ''}/`,
    resolve: {
        alias: {
            events: 'rollup-plugin-node-polyfills/polyfills/events',
        },
    },
    plugins: [react(), tsconfigPaths()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./test/setupTests.js'],
    },
}));
