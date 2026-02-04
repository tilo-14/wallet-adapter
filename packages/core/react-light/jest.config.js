import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: 'ts-jest/presets/default-esm',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    resolver: `${__dirname}/jest.resolver.cjs`,
    globals: {
        'ts-jest': {
            tsconfig: './tsconfig.tests.json',
            useESM: true,
        },
    },
    testEnvironment: 'node',
    testTimeout: 120000,
    transformIgnorePatterns: [
        '/node_modules/(?!(@lightprotocol|@solana))',
    ],
    // E2E tests must run sequentially
    maxWorkers: 1,
};
