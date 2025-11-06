/**
 * Utilities for generating and validating room codes
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
const CODE_LENGTH = 6;

/**
 * Generate a random 6-character room code
 * Format: ABC123
 */
export function generateRoomCode(): string {
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return code;
}

/**
 * Validate a room code format
 */
export function isValidRoomCode(code: string): boolean {
	if (!code || code.length !== CODE_LENGTH) {
		return false;
	}

	// Check all characters are valid
	for (const char of code.toUpperCase()) {
		if (!CHARS.includes(char)) {
			return false;
		}
	}

	return true;
}

/**
 * Format a room code for display (e.g., ABC-123)
 */
export function formatRoomCode(code: string): string {
	if (code.length !== CODE_LENGTH) {
		return code;
	}
	return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Normalize room code (remove hyphens, uppercase)
 */
export function normalizeRoomCode(code: string): string {
	return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}
