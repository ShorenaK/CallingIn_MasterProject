import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  {
    files: ['frontend/**/*.{js,jsx}', 'backend/**/*.js'],
    rules: { ...js.configs.recommended.rules, complexity: ['error', 10] },
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },
  {
    files: ['frontend/**/*.{js,jsx}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['backend/**/*.js', 'frontend/vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  prettier,
];
