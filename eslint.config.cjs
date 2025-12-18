// eslint.config.cjs
const js = require('@eslint/js');
const globals = require('globals');

const unusedImports = require('eslint-plugin-unused-imports');
const importPlugin = require('eslint-plugin-import');
const reactHooks = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript + React rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['dist/**', 'node_modules/**'], // replace .eslintignore
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
      import: importPlugin,
      'react-hooks': reactHooks,
      prettier: prettierPlugin,
    },
    rules: {
      /* ---------- Prettier ---------- */
      'prettier/prettier': 'error',

      /* ---------- Clean imports ---------- */
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none', // <-- ignore all catch clause variables
        },
      ],
      /* ---------- React hooks ---------- */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      /* ---------- TypeScript hygiene ---------- */
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none', // <-- ignore catch clause variables
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-shadow': [
        'error',
        {
          ignoreTypeValueShadow: true, // Allow shadowing in type/value namespaces
          ignoreFunctionTypeParameterNameValueShadow: true, // Allow shadowing in function type parameters
        },
      ],
      'no-shadow': 'off', // Turn off base rule as it conflicts with TypeScript version

      /* ---------- Import order ---------- */
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      /* ---------- Others ---------- */
      curly: ['error', 'all'], // enforce braces for all control statements
      'arrow-parens': ['error', 'always'], // always require parentheses for arrow function params
    },
  },
];
