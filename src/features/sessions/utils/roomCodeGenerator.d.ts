/**
 * Utilities for generating and validating room codes
 */
/**
 * Generate a random 6-character room code
 * Format: ABC123
 */
export declare function generateRoomCode(): string;
/**
 * Validate a room code format
 */
export declare function isValidRoomCode(code: string): boolean;
/**
 * Format a room code for display (e.g., ABC-123)
 */
export declare function formatRoomCode(code: string): string;
/**
 * Normalize room code (remove hyphens, uppercase)
 */
export declare function normalizeRoomCode(code: string): string;
