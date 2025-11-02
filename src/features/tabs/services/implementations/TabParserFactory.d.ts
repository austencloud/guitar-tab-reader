import { TabParserService } from './TabParserService';
import type { ParseOptions } from '../types';
/**
 * Factory function to create a fully configured tab parser
 * with all default parsing steps registered
 */
export declare function createTabParser(options?: ParseOptions): TabParserService;
