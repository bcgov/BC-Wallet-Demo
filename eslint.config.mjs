import { FlatCompat } from '@eslint/eslintrc'
import eslint from '@eslint/js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginCypress from 'eslint-plugin-cypress'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
})

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'frontend/build/**',
      '**/.git/**',
      '**/*.md',
      '**/DEVELOPER/**',
      'eslint.config.mjs',
    ],
  },
  eslint.configs.recommended,
  ...compat.extends('plugin:import/recommended'),
  ...compat.extends('plugin:import/typescript'),
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        // Use the repo-wide ESLint tsconfig so server/frontend tests are included (server/tsconfig excludes tests).
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/extensions': ['.js', '.ts', '.tsx', '.mts', '.cts'],
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.eslint.json',
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: false, variables: true },
      ],
      '@typescript-eslint/explicit-member-accessibility': 'error',
      'no-console': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: ['type', ['builtin', 'external'], 'parent', 'sibling', 'index'],
          alphabetize: {
            order: 'asc',
          },
          'newlines-between': 'always',
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: false,
          packageDir: [__dirname, path.join(__dirname, 'frontend'), path.join(__dirname, 'server')],
        },
      ],
    },
  },
  prettierRecommended,
  eslintConfigPrettier,
  {
    files: ['cypress/**/*.{ts,tsx}'],
    plugins: eslintPluginCypress.configs.recommended.plugins,
    languageOptions: eslintPluginCypress.configs.recommended.languageOptions,
    rules: {
      ...eslintPluginCypress.configs.recommended.rules,
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
    },
  },
  {
    files: ['frontend/vite.config.ts'],
    rules: {
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: [
      'cypress.config.ts',
      '**/*.config.ts',
      '**/postcss.config.js',
      '**/tailwind.config.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
          peerDependencies: true,
        },
      ],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
      '**/tests/**',
      '**/setupTests.*',
      '**/vitest.config.ts',
      'samples/**',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],
    },
  },
)
