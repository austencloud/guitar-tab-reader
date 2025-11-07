import type { ISmartImportService } from '../contracts/ISmartImportService';
import type { ImportResult, ScrapedTab } from '../../domain/types';
/**
 * Smart import service implementation
 * Handles AI-powered tab import with intent analysis
 */
export declare class SmartImportService implements ISmartImportService {
    processQuery(query: string, onProgress?: (step: string, details?: string) => void): Promise<ImportResult>;
    fetchArtistTabs(artistName: string): Promise<{
        success: boolean;
        tabs?: ScrapedTab[];
        error?: string;
    }>;
    searchSong(songName: string, artistName?: string): Promise<{
        success: boolean;
        tab?: ScrapedTab;
        tabs?: ScrapedTab[];
        error?: string;
        suggestions?: string[];
    }>;
}
