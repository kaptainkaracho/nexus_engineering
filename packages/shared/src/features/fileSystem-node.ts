/**
 * Node.js file system adapter backed by `fs/promises`.
 *
 * This file must NOT be imported from code that runs in the browser,
 * edge runtime, or any non-Node environment — the dynamic import of
 * `fs/promises` will cause bundlers to fail.
 */

import type { FileSystemAdapter } from './fileSystem'

const nodeFs: FileSystemAdapter = {
  async readFile(filePath: string, encoding: 'utf-8'): Promise<string> {
    // Dynamic import so bundlers never see `fs` in the browser graph
    const { readFile } = await import('fs/promises')
    return readFile(filePath, { encoding })
  },

  async readdir(
    dirPath: string,
    options: { withFileTypes: true },
  ): Promise<
    Array<{
      name: string
      isFile: () => boolean
      isDirectory: () => boolean
    }>
  > {
    const { readdir } = await import('fs/promises')
    return readdir(dirPath, { ...options, withFileTypes: true }) as any
  },
}

export { nodeFs }
