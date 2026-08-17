import js from '@eslint/js';

export default [
  { ignores: ['dist/**', 'tailwind.config.js'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      globals: {
        window: 'readonly', document: 'readonly', console: 'readonly', HTMLElement: 'readonly',
        customElements: 'readonly', clearInterval: 'readonly', setInterval: 'readonly',
        alert: 'readonly', fetch: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },
];
