module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      'apps/*/src/showcase-api/**',
      '**/*.spec.ts',
      '**/node_modules/**',
      '**/.next/**',
      '**/charts/**',
      '**/.turbo/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/coverage/**',
      '**/.cache/**',
      '**/logs/**',
      '**/*.log',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      import: require('eslint-plugin-import'),
      prettier: require('eslint-plugin-prettier'),
      cypress: require('eslint-plugin-cypress'),
      'import-helpers': require('eslint-plugin-import-helpers'),
    },
    settings: {
      'import/extensions': ['.js', '.ts'],
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          project: 'packages/*/tsconfig.json',
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
      '@typescript-eslint/explicit-member-accessibility': 'error',
      'no-console': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': 'error',
      'import/order': 'off',
      'import-helpers/order-imports': [
        'warn',
        {
          newlinesBetween: 'always',
          groups: ['/^react/', 'module', ['parent', 'sibling', 'index'], ['absolute']],
          alphabetize: { order: 'asc', ignoreCase: true },
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: false,
        },
      ],
      'prettier/prettier': ['warn', { endOfLine: 'auto' }],
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
      'cypress/no-pause': 'error',
    },
  },
  {
    files: ['jest.config.ts', '.eslintrc.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    files: ['*.test.ts', '**/__tests__/**', '**/tests/**', 'jest.*.ts', 'samples/**'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
]
