module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
};
