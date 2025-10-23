// @ts-check
import eslintJs from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import tseslint from "typescript-eslint";
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import regexpPlugin from 'eslint-plugin-regexp';

export default tseslint.config({
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'src/utils/namecolour.js', '.next/**', 'eslint.config.js', 'test/**', 'e2e/**', 'vite.config.ts', 'tailwind.config.js'],

    // Extend recommended rule sets from:
    // 1. ESLint JS's recommended rules
    // 2. TypeScript ESLint recommended rules
    // 3. ESLint React's recommended-typescript rules
    extends: [
        eslintJs.configs.recommended,
        tseslint.configs.recommended,
        eslintReact.configs["recommended-typescript"],
        regexpPlugin.configs["flat/recommended"],
    ],

    // Configure language/parsing options
    languageOptions: {
        // Use TypeScript ESLint parser for TypeScript files
        parser: tseslint.parser,
        parserOptions: {
            // Enable project service for better TypeScript integration
            projectService: {
                allowDefaultProject: ["*.js", "*.mjs", "*.cjs"]
            },
            tsconfigRootDir: import.meta.dirname,
        },
        globals: {
            window: 'readonly',
            document: 'readonly',
            console: 'readonly',
            process: 'readonly',
            Buffer: 'readonly',
            localStorage: 'readonly',
            sessionStorage: 'readonly',
            fetch: 'readonly',
            location: 'readonly',
            open: 'readonly',
        },
    },

    plugins: {
        'react-refresh': reactRefresh,
        'react-hooks': reactHooks,
    },

    // Custom rule overrides (modify rule levels or disable rules)
        rules: {
            // TypeScript rules
            'quotes': [
                'error',
                'single',
                { allowTemplateLiterals: true },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'indent': ['error', 4],

            // Spacing and formatting
            'space-in-parens': ['error', 'never'],
            'no-duplicate-imports': 'error',
            'function-paren-newline': ['error', 'consistent'],
            'no-octal-escape': 'error',
            'no-useless-call': 'error',
            'comma-spacing': ['error', { before: false, after: true }],
            'no-trailing-spaces': ['error', { ignoreComments: false }],
            'array-bracket-spacing': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'dot-location': ['error', 'property'],
            'wrap-iife': ['error', 'inside'],
            'arrow-body-style': 'error',
            'comma-style': ['error', 'last'],
            'space-before-blocks': ['error', 'always'],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            'no-unneeded-ternary': 'error',
            'no-new-object': 'error',
            'space-infix-ops': 'error',
            'no-return-assign': ['error', 'except-parens'],
            'comma-dangle': [
                'error',
                {
                    arrays: 'always-multiline',
                    objects: 'always-multiline',
                    imports: 'always-multiline',
                    exports: 'always-multiline',
                    functions: 'ignore',
                },
            ],
            'key-spacing': 'error',
            'yoda': ['error', 'never', { exceptRange: true }],
            'arrow-spacing': ['error', { before: true, after: true }],
            'no-useless-rename': 'error',
            'no-div-regex': 'error',
            'block-spacing': ['error', 'always'],
            'no-mixed-requires': 'error',
            'computed-property-spacing': ['error', 'never'],
            'keyword-spacing': ['error', { before: true, after: true }],
            'no-floating-decimal': 'error',
            'no-multi-spaces': 'error',
            'no-useless-computed-key': 'error',
            'object-shorthand': ['error', 'methods'],
            'rest-spread-spacing': ['error', 'never'],
            'new-parens': 'error',
            'eol-last': ['error', 'always'],
            'space-before-function-paren': [
                'error',
                { anonymous: 'always', named: 'never' },
            ],
            'operator-linebreak': ['error', 'after'],
            'curly': ['error', 'multi-line', 'consistent'],
            'space-unary-ops': ['error', { words: true, nonwords: false }],
            'no-array-constructor': 'error',
            'padded-blocks': ['error', 'never'],
            'semi': ['error', 'always'],
            'func-call-spacing': 'error',
            'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
            'semi-spacing': ['error', { before: false, after: true }],
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'template-curly-spacing': ['error', 'never'],

            // React Refresh
            'react-refresh/only-export-components': 'warn',

            // React hooks
            '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
            'react-hooks/rules-of-hooks': 'error',

            // General JavaScript
        },
});
