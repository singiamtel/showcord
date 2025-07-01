import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'src/utils/namecolour.js', '.next/**'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
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
            '@typescript-eslint': typescriptEslint,
            'react-refresh': reactRefresh,
        },
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

            // General JavaScript
        },
    },
];
