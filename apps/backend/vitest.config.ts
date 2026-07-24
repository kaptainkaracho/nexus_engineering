import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: [
      'src/traceabilityLinks/store.test.ts',
      'src/parsers/repositoryParser.test.ts',
      'dist/**',
      'node_modules/**',
    ],
  },
})
