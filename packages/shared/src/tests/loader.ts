import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { testDocSchema } from './schema';
import type { TestDocument } from './format';

export class TestLoader {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
  }

  async findTestFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subResults = await this.findTestFiles(fullPath);
        results.push(...subResults);
      } else if (entry.isFile() && path.extname(entry.name) === '.yaml' &&
                 entry.name.endsWith('.test.yaml')) {
        results.push(fullPath);
      }
    }

    return results;
  }

  async loadTestFile(filePath: string): Promise<TestDocument> {
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const doc = yaml.load(fileContents) as any;

    const validate = this.ajv.compile(testDocSchema);
    if (!validate(doc)) {
      throw new Error(
        `Schema validation failed for ${filePath}: ` +
        validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('; '),
      );
    }

    return doc as TestDocument;
  }
}

export interface TestLoadResult {
  document: TestDocument | null;
  errors: Map<string, string[]>;
}

let testValidator: any = null;
async function importValidator() {
  if (!testValidator) {
    const mod = await import('./validator');
    testValidator = mod;
  }
  return testValidator;
}

export class ValidatedTestLoader extends TestLoader {
  async loadWithValidation(filePath: string): Promise<TestLoadResult> {
    let doc: TestDocument;
    try {
      doc = await super.loadTestFile(filePath);
    } catch (error) {
      return {
        document: null,
        errors: new Map([['file', [(error as Error).message]]]),
      };
    }

    const validator = await importValidator();

    try {
      const result = await validator.validateTestDocument(doc);
      return {
        document: doc,
        errors: result.errors || new Map(),
      };
    } catch (error: unknown) {
      return {
        document: doc,
        errors: new Map([['validator', [(error as Error).message]]]),
      };
    }
  }

  async loadAllWithValidation(dirPath: string): Promise<TestLoadResult[]> {
    const filePaths = await this.findTestFiles(dirPath);
    const results: TestLoadResult[] = [];

    if (!filePaths || filePaths.length === 0) {
      throw new Error(`No test files found in ${dirPath}`);
    }

    const allDocs: TestDocument[] = [];
    for (const filePath of filePaths) {
      try {
        const doc = await super.loadTestFile(filePath);
        allDocs.push(doc);
      } catch (error: unknown) {
        results.push({
          document: null,
          errors: new Map([['file', [(error as Error).message]]]),
        });
      }
    }

    const validator = await importValidator();
    for (const doc of allDocs) {
      try {
        const validationResult = await validator.validateTestDocument(doc, allDocs);
        results.push({
          document: doc,
          errors: validationResult.errors || new Map(),
        });
      } catch (error) {
        results.push({
          document: doc,
          errors: new Map([['validator', [(error as Error).message]]]),
        });
      }
    }

    return results;
  }
}

export const testLoader = new TestLoader();
export const validatedTestLoader = new ValidatedTestLoader();
