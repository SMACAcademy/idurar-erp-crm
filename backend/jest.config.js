// jest.config.js or jest.config.ts
module.exports = {
  // ...other config
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
