// @ts-check
// Configuración flat de ESLint 9 para TypeScript, integrada con Prettier.
// El pipeline la ejecuta con `npm run lint` y bloquea el despliegue si falla.
import eslint from '@eslint/js';
import prettierRecomendado from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '*.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecomendado,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Un parámetro o variable con prefijo `_` señala "intencionadamente sin usar".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    // Las pruebas leen cuerpos de respuesta sin tipar (`response.body`), donde
    // exigir tipos explícitos añadiría ruido sin aportar seguridad real.
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
