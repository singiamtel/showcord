import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

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

/**
 * Preload woff2 font files discovered in the build output.
 */
function fontPreloadPlugin(): Plugin {
    return {
        name: 'showcord-font-preload',
        enforce: 'post',
        transformIndexHtml: {
            order: 'post',
            handler(_html: string, ctx: { bundle?: Record<string, { fileName?: string }> }) {
                if (!ctx.bundle) return [];

                const tags: { tag: string; attrs: Record<string, string | boolean>; injectTo: string }[] = [];

                for (const [key, asset] of Object.entries(ctx.bundle)) {
                    if (key.endsWith('.woff2')) {
                        tags.push({
                            tag: 'link',
                            attrs: {
                                rel: 'preload',
                                href: `/${asset.fileName!}`,
                                as: 'font',
                                type: 'font/woff2',
                                crossorigin: true,
                            },
                            injectTo: 'head-prepend',
                        });
                    }
                }

                return tags;
            },
        },
    };
}

export default defineConfig(() => ({
    base: `${process.env.PUBLIC_URL ?? ''}/`,
    server: {
        allowedHosts: true,
    },
    resolve: {
        alias: {
            events: 'rollup-plugin-node-polyfills/polyfills/events',
            buffer: 'buffer',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'pkmn-vendor': ['@pkmn/dex', '@pkmn/data', '@pkmn/client', '@pkmn/view'],
                    'framer-motion': ['framer-motion'],
                    'sanitize': ['sanitize-html-react', 'html-react-parser'],
                    'fortawesome': ['@fortawesome/fontawesome-svg-core', '@fortawesome/free-solid-svg-icons'],
                    'highlight': ['highlight.js'],
                    'vendor-utils': ['immer', 'axios', 'minisearch', 'linkifyjs', 'linkify-react'],
                },
            },
        },
    },
    plugins: [fontPreloadPlugin(), fixPsCircularDep(), tailwindcss(), react(), tsconfigPaths()],
}));
