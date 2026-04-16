import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'check-schedule.mjs']),
  {
    files: ['**/*.ts'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettier,
  {
    ignores: ['eslint.config.ts'],
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'prettier/prettier': 'error',
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  {
    files: ['src/schema.ts', 'src/middleware/validate.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['src/services/availability.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['src/routes/availability.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
]);
