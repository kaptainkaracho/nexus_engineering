import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { featureDocSchema } from './schema';
import type { FeatureDocument } from './format';

/**
 * Load and validate Features as Code documents (.feature.yaml) from filesystem
 */
export class FeatureLoader {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  /**
   * Find all .feature.yaml files in a directory (recursively)
   */
  async findFeatureFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
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
    const fileContents = await fs.readFile(filePath, 'utf-8');
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
 * Singleton instances for global use
 */
export const featureLoader = new FeatureLoader();
export const validatedFeatureLoader = new ValidatedFeatureLoader();
