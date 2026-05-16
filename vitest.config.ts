import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

function fixPsCircularDep(): Plugin {
    return {
        name: 'fix-ps-circular-dep',
        transform(code, id) {
            if (!id.includes('/vendor/pokemon-showdown/')) return null;

            let transformed = code;

            if (id.includes('battle-dex-data.ts')) {
                transformed = transformed.replace(
                    /import\s*\{\s*Dex\s*,\s*toID\s*\}\s*from\s*["']\.\/battle-dex["'];?/,
                    'import { toID } from "./battle-dex";'
                );
                transformed = transformed.replace(/Dex\.sanitizeName/g, 'window.Dex.sanitizeName');
            }

            if (id.includes('battle-animations.ts')) {
                transformed = transformed.replace(
                    /if\s*\(\s*!window\.Dex\s*\|\|\s*!Dex\.resourcePrefix\s*\)/g,
                    'if (!window.Dex || !window.Dex.resourcePrefix)'
                );
                transformed = transformed.replace(
                    /[=]\s*Dex\.fxPrefix\s*\+/g,
                    '= window.Dex.fxPrefix +'
                );
            }

            return transformed !== code ? { code: transformed, map: null } : null;
        },
    };
}

export default defineConfig(() => ({
    base: `${process.env.PUBLIC_URL ?? ''}/`,
    server: {
        allowedHosts: true as const,
    },
    resolve: {
        alias: {
            events: 'rollup-plugin-node-polyfills/polyfills/events',
            buffer: 'buffer',
        },
    },
    plugins: [fixPsCircularDep(), tailwindcss(), react(), tsconfigPaths()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./test/setupTests.ts'],
        retry: 2,
        maxConcurrency: 4,
        include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            thresholds: {
                statements: 58,
                branches: 50,
                functions: 53,
                lines: 59,
            },
            exclude: [
                '**/vendor/**',
                '**/test/**',
                '**/*.d.ts',
                '**/node_modules/**',
            ],
        },
    },
}));
