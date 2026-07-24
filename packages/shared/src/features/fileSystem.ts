/**
 * Platform-agnostic file system adapter interface.
 *
 * This module has zero Node.js dependencies so it can be safely
 * consumed from browser / worker / edge builds.
 */

export interface FileSystemAdapter {
  /** Read the entire contents of a file as UTF-8 text. */
  readFile(filePath: string, encoding: 'utf-8'): Promise<string>

  /**
   * List directory entries with type information.
   * Throws if *dirPath* does not exist or is not a directory.
   */
  readdir(dirPath: string, options: { withFileTypes: true }): Promise<
    Array<{
      name: string
      isFile: () => boolean
      isDirectory: () => boolean
    }>
  >
}
