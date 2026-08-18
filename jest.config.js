module.exports = {
    clearMocks: true,
    collectCoverageFrom: [
        'src/js/**/*.js',
    ],
    coverageDirectory: 'coverage',
    moduleNameMapper: {
        '\\.(css)$': '<rootDir>/test/support/style-mock.js',
    },
    roots: [
        '<rootDir>/test',
    ],
    testEnvironment: 'jsdom',
};
