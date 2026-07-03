import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';

/**
 * Load and validate requirement documents from filesystem
 */
export class RequirementsLoader {
  private ajv: Ajv.Ajv;
  
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

/**
 * Singleton instance for global use
 */
export const requirementsLoader = new RequirementsLoader();