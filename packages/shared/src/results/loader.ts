import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { resultsDocSchema } from './schema';
import type { ResultsDocument } from './format';

/**
 * Load and validate Test Execution Results documents (.ter.yaml) from filesystem
 */
export class ResultsLoader {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  /**
   * Find all .ter.yaml files in a directory (recursively)
   */
  async findResultsFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subResults = await this.findResultsFiles(fullPath);
        results.push(...subResults);
      } else if (
        entry.isFile() &&
        path.extname(entry.name) === '.yaml' &&
        entry.name.endsWith('.ter.yaml')
      ) {
        results.push(fullPath);
      }
    }

    return results;
  }

  /**
   * Load and structurally validate a single TER file
   */
  async loadResultsFile(filePath: string): Promise<ResultsDocument> {
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const doc = yaml.load(fileContents) as any;

    const validate = this.ajv.compile(resultsDocSchema);
    if (!validate(doc)) {
      throw new Error(
        `Schema validation failed for ${filePath}: ` +
          validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; '),
      );
    }

    return doc as ResultsDocument;
  }
}

export interface ResultsLoadResult {
  document: ResultsDocument | null;
  errors: Map<string, string[]>;
  violations?: any[];
}

let resultsValidator: any = null;
async function importValidator() {
  if (!resultsValidator) {
    const mod = await import('./validator');
    resultsValidator = mod;
  }
  return resultsValidator;
}

/**
 * Results loader that also runs logical validation on each document.
 */
export class ValidatedResultsLoader extends ResultsLoader {
  async loadWithValidation(filePath: string): Promise<ResultsLoadResult> {
    let doc: ResultsDocument;
    try {
      doc = await super.loadResultsFile(filePath);
    } catch (error) {
      return {
        document: null,
        errors: new Map([['file', [(error as Error).message]]]),
        violations: [],
      };
    }

    const validator = await importValidator();

    try {
      const result = await validator.validateResultsDocument(doc);
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

  async loadAllWithValidation(dirPath: string): Promise<ResultsLoadResult[]> {
    const filePaths = await this.findResultsFiles(dirPath);
    const results: ResultsLoadResult[] = [];

    if (!filePaths || filePaths.length === 0) {
      throw new Error(`No TER files found in ${dirPath}`);
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
export const resultsLoader = new ResultsLoader();
export const validatedResultsLoader = new ValidatedResultsLoader();
