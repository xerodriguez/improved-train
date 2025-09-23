module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    moduleNameMapper: {
        '^@mui/(.*)$': '<rootDir>/node_modules/@mui/$1',
        '\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^.+\.(svg|png|jpg|jpeg|gif|ttf|woff|woff2)$': 'jest-transform-stub',
    },
    resolver: 'jest-resolver',
};
