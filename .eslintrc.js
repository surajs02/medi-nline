module.exports = {
    extends: ['eslint-config-jsx'],
    env: { mocha: true },
    root: true,
    parser: '@babel/eslint-parser',
    ignorePatterns: ['**/node_modules/*', '**/dist/*'],
};
