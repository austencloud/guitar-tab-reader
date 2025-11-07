import { injectable } from 'inversify';
import type { IResponsiveFontCalculator } from '../contracts/IResponsiveFontCalculator';

/**
 * Responsive font calculator service implementation
 * Pure calculation logic with zero Svelte dependencies
 */
@injectable()
export class ResponsiveFontCalculator implements IResponsiveFontCalculator {
	private readonly CHAR_WIDTH_RATIO = 0.6; // Monospace character width ratio
	private readonly MAX_FONT_SIZE = 32; // Maximum reasonable font size
	private readonly DEFAULT_MIN_SIZE = 8; // Default minimum font size
	private readonly PINCH_SCALE_FACTOR = 20; // Pixels of pinch distance per 1px font size change

	calculateMaxSafeFontSize(
		content: string,
		containerWidth: number,
		currentFontSize: number
	): number {
		if (!containerWidth || !content) {
			return currentFontSize;
		}

		// Find the longest line in the content
		const lines = content.split('\n');
		const longestLine = lines.reduce((longest, current) => 
			current.length > longest.length ? current : longest, 
			''
		);

		if (!longestLine.length) {
			return currentFontSize;
		}

		// Calculate maximum font size that fits without overflow
		const availableWidth = containerWidth;
		const maxFontSize = availableWidth / (longestLine.length * this.CHAR_WIDTH_RATIO);

		// Return a reasonable maximum (don't let it get ridiculously large)
		return Math.min(maxFontSize, this.MAX_FONT_SIZE);
	}

	calculateResponsiveFontSize(
		userPreferredSize: number,
		maxSafeSize: number,
		minSize: number = this.DEFAULT_MIN_SIZE
	): number {
		// Use the smaller of user preference or max safe size, with minimum constraint
		return Math.max(Math.min(userPreferredSize, maxSafeSize), minSize);
	}

	calculatePinchFontSize(
		initialDistance: number,
		currentDistance: number,
		initialFontSize: number,
		maxSafeSize: number,
		minSize: number = this.DEFAULT_MIN_SIZE
	): number {
		// Calculate distance change
		const distanceChange = currentDistance - initialDistance;

		// Calculate font size change (1px change per PINCH_SCALE_FACTOR pixels of pinch distance)
		const fontSizeChange = distanceChange / this.PINCH_SCALE_FACTOR;
		const newFontSize = initialFontSize + fontSizeChange;

		// Constrain to safe bounds
		return Math.max(minSize, Math.min(newFontSize, maxSafeSize));
	}
}

