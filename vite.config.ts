import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Fix circular dependency in vendored Pokemon Showdown files.
 * Isn't it crazy that vite lets you do this? :D
 */
function fixPsCircularDep(): Plugin {
    return {
        name: 'fix-ps-circular-dep',
        transform(code, id) {
            if (!id.includes('/vendor/pokemon-showdown/')) return null;

            let transformed = code;

            // battle-dex-data.ts: uses Dex.sanitizeName in constructors
            if (id.includes('battle-dex-data.ts')) {
                transformed = transformed.replace(
                    /import\s*\{\s*Dex\s*,\s*toID\s*\}\s*from\s*["']\.\/battle-dex["'];?/,
                    'import { toID } from "./battle-dex";'
                );
                transformed = transformed.replace(/Dex\.sanitizeName/g, 'window.Dex.sanitizeName');
            }

            // battle-animations.ts: IIFE at module level uses Dex.fxPrefix
            if (id.includes('battle-animations.ts')) {
                // Fix the IIFE that runs at load time (line ~3205)
                // Change: if (!window.Dex || !Dex.resourcePrefix) return;
                // To:     if (!window.Dex || !window.Dex.resourcePrefix) return;
                transformed = transformed.replace(
                    /if\s*\(\s*!window\.Dex\s*\|\|\s*!Dex\.resourcePrefix\s*\)/g,
                    'if (!window.Dex || !window.Dex.resourcePrefix)'
                );
                // Change: BattleEffects[id].url = Dex.fxPrefix + ...
                // To:     BattleEffects[id].url = window.Dex.fxPrefix + ...
                transformed = transformed.replace(
                    /=\s*Dex\.fxPrefix\s*\+/g,
                    '= window.Dex.fxPrefix +'
                );
            }

            return transformed !== code ? { code: transformed, map: null } : null;
        },
    };
}

export default defineConfig(() => ({
    base: `${process.env.PUBLIC_URL ?? ''}/`,
    resolve: {
        alias: {
            events: 'rollup-plugin-node-polyfills/polyfills/events',
            buffer: 'buffer',
        },
    },
    plugins: [fixPsCircularDep(), react(), tsconfigPaths()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./test/setupTests.js'],
    },
}));
