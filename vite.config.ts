import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

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
    define: {
        global: 'globalThis',
    },
    server: {
        allowedHosts: true,
    },
    resolve: {
        alias: {
            events: 'rollup-plugin-node-polyfills/polyfills/events',
            buffer: 'buffer',
        },
        tsconfigPaths: true,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (id.includes('@pkmn/dex') || id.includes('@pkmn/data') || id.includes('@pkmn/client') || id.includes('@pkmn/view')) return 'pkmn-vendor';
                    if (id.includes('framer-motion')) return 'framer-motion';
                    if (id.includes('sanitize-html-react') || id.includes('html-react-parser')) return 'sanitize';
                    if (id.includes('@fortawesome/fontawesome-svg-core') || id.includes('@fortawesome/free-solid-svg-icons')) return 'fortawesome';
                    if (id.includes('highlight.js')) return 'highlight';
                    if (id.includes('immer') || id.includes('axios') || id.includes('minisearch') || id.includes('linkifyjs') || id.includes('linkify-react')) return 'vendor-utils';
                    return undefined;
                },
            },
        },
    },
    plugins: [
        fontPreloadPlugin(),
        fixPsCircularDep(),
        tailwindcss(),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['assets/**/*', 'icons/**/*'],
            devOptions: {
                enabled: true,
            },
            manifest: {
                name: 'Showcord',
                short_name: 'Showcord',
                description: 'A modern Pokemon Showdown client for battles and chat.',
                start_url: '/',
                display: 'standalone',
                background_color: '#1a1a2e',
                theme_color: '#1a1a2e',
                icons: [
                    { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,webp,woff2,svg}'],
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/play\.pokemonshowdown\.com\/.*/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'ps-data',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7,
                            },
                        },
                    },
                ],
            },
        }),
    ],
}));
