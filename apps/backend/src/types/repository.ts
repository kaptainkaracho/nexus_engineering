// Repository types for API endpoints
import { FileMetadata, ScanReport } from '@nexus-engineering/shared'

export interface RepoNode {
  id: string
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  extension?: string
  isBinary?: boolean
  children?: RepoNode[]
}

export interface RepoTree {
  root: RepoNode
  nodesByPath: Record<string, RepoNode>
}

export interface ScanResult {
  fileMetadata: FileMetadata[]
  scanReport: ScanReport
  tree?: RepoTree | null
}

export interface StreamOptions {
  patterns?: string[]
  rootPath?: string
}