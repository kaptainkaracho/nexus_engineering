import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import { featureDocSchema } from './schema';
import type { FeatureDocument } from './format';
import type { FileSystemAdapter } from './fileSystem';

// Lazy-loaded Node.js dependencies — static top-level imports of these would
// pull `fs/promises` and `path` into the frontend bundle and break TS resolution.
let _pathModule: typeof import('path') | null = null

async function getPathModule(): Promise<typeof import('path')> {
  if (!_pathModule) {
    _pathModule = await import('path')
  }
  return _pathModule
}

let _defaultFs: FileSystemAdapter | null = null

async function getDefaultFs(): Promise<FileSystemAdapter> {
  if (!_defaultFs) {
    const mod = await import('./fileSystem-node')
    _defaultFs = mod.nodeFs
  }
  return _defaultFs
}

/**
 * Load and validate Features as Code documents (.feature.yaml) from filesystem
 */
export class FeatureLoader {
  private ajv: Ajv;
  private fs: FileSystemAdapter;

  constructor(fs?: FileSystemAdapter) {
    this.ajv = new Ajv();
    this.fs = fs ?? (() => {
      if (typeof process === 'undefined') {
        throw new Error('FeatureLoader requires a FileSystemAdapter in non-Node environments')
      }
      if (!_defaultFs) {
        throw new Error('Default FileSystemAdapter not yet initialized. Use getFeatureLoader() factory instead.')
      }
      return _defaultFs
    })();
  }

  /**
   * Find all .feature.yaml files in a directory (recursively)
   */
  async findFeatureFiles(dirPath: string): Promise<string[]> {
    const path = await getPathModule();
    const entries = await this.fs.readdir(dirPath, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subResults = await this.findFeatureFiles(fullPath);
        results.push(...subResults);
      } else if (
        entry.isFile() &&
        path.extname(entry.name) === '.yaml' &&
        entry.name.endsWith('.feature.yaml')
      ) {
        results.push(fullPath);
      }
    }

    return results;
  }

  /**
   * Load and structurally validate a single FAC file
   */
  async loadFeatureFile(filePath: string): Promise<FeatureDocument> {
    const fileContents = await this.fs.readFile(filePath, 'utf-8');
    const doc = yaml.load(fileContents) as any;

    const validate = this.ajv.compile(featureDocSchema);
    if (!validate(doc)) {
      throw new Error(
        `Schema validation failed for ${filePath}: ` +
          validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; '),
      );
    }

    return doc as FeatureDocument;
  }
}

export interface FeatureLoadResult {
  document: FeatureDocument | null;
  errors: Map<string, string[]>;
  violations?: any[];
}

let featureValidator: any = null;
async function importValidator() {
  if (!featureValidator) {
    const mod = await import('./validator');
    featureValidator = mod;
  }
  return featureValidator;
}

/**
 * Feature loader that also runs logical validation on each document.
 */
export class ValidatedFeatureLoader extends FeatureLoader {
  async loadWithValidation(filePath: string): Promise<FeatureLoadResult> {
    let doc: FeatureDocument;
    try {
      doc = await super.loadFeatureFile(filePath);
    } catch (error) {
      return {
        document: null,
        errors: new Map([['file', [(error as Error).message]]]),
        violations: [],
      };
    }

    const validator = await importValidator();

    try {
      const result = await validator.validateFeatureDocument(doc);
      return {
        document: doc,
        errors: result.errors || new Map(),
        violations: result.errors ? Array.from(result.errors.entries()) : [],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Validation error';
      return {
        document: doc,
        errors: new Map([['validator', [message]]]),
        violations: [],
      };
    }
  }

  async loadAllWithValidation(dirPath: string): Promise<FeatureLoadResult[]> {
    const filePaths = await this.findFeatureFiles(dirPath);
    const results: FeatureLoadResult[] = [];

    if (!filePaths || filePaths.length === 0) {
      throw new Error(`No FAC files found in ${dirPath}`);
    }

    for (const fp of filePaths) {
      results.push(await this.loadWithValidation(fp));
    }

    return results;
  }
}

/**
 * Lazy singleton factories — resolve the Node.js FileSystemAdapter
 * on first call so the shared package can be type-checked in browser contexts.
 */
let _featureLoader: FeatureLoader | null = null
let _validatedFeatureLoader: ValidatedFeatureLoader | null = null

export async function getFeatureLoader(): Promise<FeatureLoader> {
  if (!_featureLoader) {
    _featureLoader = new FeatureLoader(await getDefaultFs())
  }
  return _featureLoader
}

export async function getValidatedFeatureLoader(): Promise<ValidatedFeatureLoader> {
  if (!_validatedFeatureLoader) {
    _validatedFeatureLoader = new ValidatedFeatureLoader(await getDefaultFs())
  }
  return _validatedFeatureLoader
}
