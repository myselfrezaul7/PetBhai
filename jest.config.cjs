module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@google/genai$': '<rootDir>/__mocks__/googleGenaiMock.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          target: 'ES2022',
          allowJs: true,
          skipLibCheck: true,
          isolatedModules: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        diagnostics: false,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};
