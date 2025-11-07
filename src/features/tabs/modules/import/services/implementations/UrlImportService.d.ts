import type { IUrlImportService } from '../contracts/IUrlImportService';
/**
 * URL import service implementation
 * Handles fetching tabs from Ultimate Guitar URLs
 */
export declare class UrlImportService implements IUrlImportService {
    fetchFromUrl(url: string): Promise<{
        success: boolean;
        title?: string;
        artist?: string;
        content?: string;
        error?: string;
    }>;
}
