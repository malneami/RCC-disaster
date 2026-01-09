module.exports = {
  // Frontend TypeScript/JavaScript files - only format/lint staged changes
  'apps/frontend/**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  // Backend TypeScript files - only format/lint staged changes
  'apps/backend/**/*.ts': [
    'eslint --fix',
    'prettier --write',
  ],
  // JSON and Markdown files - only format staged changes
  '**/*.{json,md}': [
    'prettier --write',
  ],
};

