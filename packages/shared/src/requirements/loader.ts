import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';

/**
 * Load and validate requirement documents from filesystem
 */
export class RequirementsLoader {
  private ajv: Ajv;
 
  constructor() {
    this.ajv = new Ajv();
  }
  
  /**
   * Find all .req.yaml files in a directory
   */
  async findRequirementFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: string[] = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subResults = await this.findRequirementFiles(fullPath);
        results.push(...subResults);
      } else if (entry.isFile() && path.extname(entry.name) === '.yaml' && 
                 entry.name.endsWith('.req.yaml')) {
        results.push(fullPath);
      }
    }
    
    return results;
  }
  
  /**
   * Load and validate a single requirement document
   */
  async loadRequirementFile(filePath: string) {
    try {
      const fileContents = await fs.readFile(filePath, 'utf-8');
      const doc = yaml.load(fileContents) as any;
      
      // TODO: Add schema validation when reqDocSchema is available
      // const validate = this.ajv.compile(schema);
      // if (!validate(doc)) {
      //   throw new Error(`Validation failed: ${validate.errors?.map(e => e.message).join(', ')}`);
      // }
      
      return doc;
    } catch (error) {
      console.error(`Error loading requirement file ${filePath}:`, error);
      throw error;
    }
  }
}

// Import validator here to avoid circular dependency
let traceValidator: any = null;
async function importValidator() {
  if (!traceValidator) {
    // Note: Dynamic import will be resolved at runtime since this is an ESM module
    const mod = await import('./validator');
    traceValidator = mod;
  }
  return traceValidator;
}

export interface LoadResult {
  document: any;
  errors: Map<string, string[]>;
  violations?: any[]; // Trace link violations
}

export class ValidatedRequirementsLoader extends RequirementsLoader {
  
  /**
   * Load and validate a requirement file with trace links
   */
  async loadWithTraceValidation(filePath: string): Promise<LoadResult> {
    let doc: any;
    try {
      doc = await super.loadRequirementFile(filePath);
    } catch (error) {
      return {
        document: null,
        errors: new Map([['file', ['Failed to load file']]]),
        violations: []
      };
    }
    
    const validator = await importValidator();
    
    try {
      const validationResult = await validator.validateRequirementDocument(doc);
      return {
        document: doc,
        errors: validationResult.errors || new Map(),
        violations: validationResult.errors ? Array.from(validationResult.errors.entries()) : []
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Validation error';
      console.error(`Trace link validation failed for ${filePath}:`, error);
      return {
        document: doc,
        errors: new Map([['validator', [message]]]),
        violations: []
      };
    }
  }
 
  /**
   * Load multiple requirement files and validate trace links across them
   */
  async loadAllWithTraceValidation(dirPath: string): Promise<LoadResult[]> {
    const filePaths = await this.findRequirementFiles(dirPath);
    const results: LoadResult[] = [];
    
    if (!filePaths || filePaths.length === 0) {
      throw new Error(`No requirement files found in ${dirPath}`);
    }
    
    // First load all documents without validation
    const allDocs: any[] = [];
    for (const filePath of filePaths) {
      try {
        const doc = await super.loadRequirementFile(filePath);
        allDocs.push(doc);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Load error';
        results.push({
          document: null,
          errors: new Map([['file', [message]]]),
          violations: []
        });
      }
    }
    
    // Validate each document against all others
    const validator = await importValidator();
    for (let i = 0; i < filePaths.length; i++) {
      try {
        // Load other documents for cross-validation
        const otherDocs = allDocs.filter((_, idx) => idx !== i);
        
        const doc = allDocs[i];
        const validationResult = await validator.validateRequirementDocument(
          doc,
          otherDocs.length > 0 ? otherDocs : undefined,
          this.getExternalArtifactLookup(allDocs)
        );
        
        results.push({
          document: doc,
          errors: validationResult.errors || new Map(),
          violations: validationResult.errors ? Array.from(validationResult.errors.entries()) : []
        });
      } catch (error) {
        console.error(`Cross-document validation failed for ${filePaths[i]}`, error);
        results.push({
          document: allDocs[i],
          errors: new Map([['validator', ['Cross-validation failed']]]),
          violations: []
        });
      }
    }
    
    return results;
  }
  
  /**
   * Create lookup map of external artifacts from requirement documents
   */
  private getExternalArtifactLookup(docs: any[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const doc of docs) {
      const docId = this.getDocumentId(doc);
      if (!docId || !result[docId]) continue;
      
      // Include requirement IDs as "artifacts" that can be referenced
      result[docId] = [];
    }
    return result;
  }
  
  /**
   * Helper to extract document ID from a requirement document
   */
  private getDocumentId(doc: any): string {
    try {
      return doc.nexus?.metadata?.documentId || doc.nexus?.metadata?.domain || 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }
}

/**
 * Singleton instance for global use
 */
export const requirementsLoader = new RequirementsLoader();
export const validatedRequirementsLoader = new ValidatedRequirementsLoader();