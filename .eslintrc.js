module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript-like props
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console statements for debugging
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Serverless functions can use console for debugging
      files: ['**/glean.functions/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}; 