import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '../..');
const SRC_DIR = resolve(PROJECT_ROOT, 'src');

function collectSourceFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (entry === 'vendor') continue;
        if (statSync(full).isDirectory()) {
            files.push(...collectSourceFiles(full));
        } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
            files.push(full);
        }
    }
    return files;
}

function resolveImportPath(importPath: string, fromFile: string): string | null {
    let base: string;
    if (importPath.startsWith('@/')) {
        base = resolve(SRC_DIR, importPath.slice(2));
    } else if (importPath.startsWith('.')) {
        base = resolve(dirname(fromFile), importPath);
    } else {
        return null; // external package
    }

    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
    return candidates.find(existsSync) ?? null;
}

function parseLocalImports(file: string): string[] {
    const content = readFileSync(file, 'utf-8');
    const pattern = /^\s*(?:import|export)\s+(?!type\s+)(?:.*?\s+from\s+)?['"]([^'"]+)['"]/gm;
    const resolved: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
        const target = resolveImportPath(match[1], file);
        if (target) resolved.push(target);
    }
    return resolved;
}

function findCycles(graph: Map<string, string[]>): string[][] {
    const cycles: string[][] = [];
    const color = new Map<string, 'white' | 'gray' | 'black'>();
    const path: string[] = [];

    for (const node of graph.keys()) color.set(node, 'white');

    function dfs(node: string) {
        color.set(node, 'gray');
        path.push(node);
        for (const dep of graph.get(node) ?? []) {
            if (!color.has(dep)) continue;
            if (color.get(dep) === 'gray') {
                const cycleStart = path.indexOf(dep);
                cycles.push(path.slice(cycleStart).map(f => relative(PROJECT_ROOT, f)));
            } else if (color.get(dep) === 'white') {
                dfs(dep);
            }
        }
        path.pop();
        color.set(node, 'black');
    }

    for (const node of graph.keys()) {
        if (color.get(node) === 'white') dfs(node);
    }
    return cycles;
}

describe('Import graph', () => {
    it('has no circular dependencies in src/', () => {
        const files = collectSourceFiles(SRC_DIR);
        const graph = new Map<string, string[]>();
        for (const file of files) {
            graph.set(file, parseLocalImports(file));
        }

        const cycles = findCycles(graph);
        expect(cycles, `Circular imports detected:\n${cycles.map(c => c.join(' → ')).join('\n')}`).toHaveLength(0);
    });
});
