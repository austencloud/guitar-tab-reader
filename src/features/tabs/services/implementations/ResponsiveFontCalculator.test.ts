import { describe, it, expect, beforeEach } from 'vitest';
import { ResponsiveFontCalculator } from './ResponsiveFontCalculator';

describe('ResponsiveFontCalculator', () => {
	let calculator: ResponsiveFontCalculator;

	beforeEach(() => {
		calculator = new ResponsiveFontCalculator();
	});

	describe('calculateMaxSafeFontSize', () => {
		it('should calculate max font size based on longest line', () => {
			const content = 'Short\nThis is a much longer line\nMedium';
			const containerWidth = 500;
			const currentFontSize = 16;

			const maxSize = calculator.calculateMaxSafeFontSize(content, containerWidth, currentFontSize);

			expect(maxSize).toBeGreaterThan(0);
			expect(maxSize).toBeLessThanOrEqual(32); // MAX_FONT_SIZE constant
		});

		it('should return current font size when container width is 0', () => {
			const content = 'Test content';
			const currentFontSize = 16;

			const maxSize = calculator.calculateMaxSafeFontSize(content, 0, currentFontSize);

			expect(maxSize).toBe(currentFontSize);
		});

		it('should return current font size when content is empty', () => {
			const currentFontSize = 16;

			const maxSize = calculator.calculateMaxSafeFontSize('', 500, currentFontSize);

			expect(maxSize).toBe(currentFontSize);
		});

		it('should cap at MAX_FONT_SIZE (32px)', () => {
			const content = 'A'; // Very short content
			const containerWidth = 10000; // Very wide container

			const maxSize = calculator.calculateMaxSafeFontSize(content, containerWidth, 16);

			expect(maxSize).toBe(32);
		});

		it('should handle multi-line content correctly', () => {
			const content = 'Line 1\nThis is the longest line in the content\nLine 3';
			const containerWidth = 500;

			const maxSize = calculator.calculateMaxSafeFontSize(content, containerWidth, 16);

			// Should be based on the longest line
			expect(maxSize).toBeGreaterThan(0);
			expect(maxSize).toBeLessThanOrEqual(32);
		});
	});

	describe('calculateResponsiveFontSize', () => {
		it('should return user preferred size when within safe bounds', () => {
			const userPreferred = 16;
			const maxSafe = 24;

			const fontSize = calculator.calculateResponsiveFontSize(userPreferred, maxSafe);

			expect(fontSize).toBe(userPreferred);
		});

		it('should cap at max safe size when user preference exceeds it', () => {
			const userPreferred = 30;
			const maxSafe = 20;

			const fontSize = calculator.calculateResponsiveFontSize(userPreferred, maxSafe);

			expect(fontSize).toBe(maxSafe);
		});

		it('should enforce minimum of 8px', () => {
			const userPreferred = 4;
			const maxSafe = 20;

			const fontSize = calculator.calculateResponsiveFontSize(userPreferred, maxSafe);

			expect(fontSize).toBe(8);
		});

		it('should handle edge case where max safe is below minimum', () => {
			const userPreferred = 16;
			const maxSafe = 5;

			const fontSize = calculator.calculateResponsiveFontSize(userPreferred, maxSafe);

			expect(fontSize).toBe(8); // Should still enforce 8px minimum
		});
	});

	describe('calculatePinchFontSize', () => {
		it('should increase font size when pinching out', () => {
			const initialDistance = 100;
			const currentDistance = 120; // Pinching out
			const initialFontSize = 16;
			const maxSafe = 32;

			const newSize = calculator.calculatePinchFontSize(
				initialDistance,
				currentDistance,
				initialFontSize,
				maxSafe
			);

			expect(newSize).toBeGreaterThan(initialFontSize);
		});

		it('should decrease font size when pinching in', () => {
			const initialDistance = 100;
			const currentDistance = 80; // Pinching in
			const initialFontSize = 16;
			const maxSafe = 32;

			const newSize = calculator.calculatePinchFontSize(
				initialDistance,
				currentDistance,
				initialFontSize,
				maxSafe
			);

			expect(newSize).toBeLessThan(initialFontSize);
		});

		it('should respect max safe font size', () => {
			const initialDistance = 100;
			const currentDistance = 500; // Large pinch out
			const initialFontSize = 16;
			const maxSafe = 24;

			const newSize = calculator.calculatePinchFontSize(
				initialDistance,
				currentDistance,
				initialFontSize,
				maxSafe
			);

			expect(newSize).toBeLessThanOrEqual(maxSafe);
		});

		it('should enforce minimum of 8px', () => {
			const initialDistance = 100;
			const currentDistance = 10; // Large pinch in
			const initialFontSize = 16;
			const maxSafe = 32;

			const newSize = calculator.calculatePinchFontSize(
				initialDistance,
				currentDistance,
				initialFontSize,
				maxSafe
			);

			expect(newSize).toBeGreaterThanOrEqual(8);
		});

		it('should use PINCH_SCALE_FACTOR (20) for distance-to-font conversion', () => {
			const initialDistance = 100;
			const currentDistance = 120; // 20px difference
			const initialFontSize = 16;
			const maxSafe = 32;

			const newSize = calculator.calculatePinchFontSize(
				initialDistance,
				currentDistance,
				initialFontSize,
				maxSafe
			);

			// 20px distance change / 20 scale factor = 1px font change
			expect(newSize).toBe(17);
		});
	});
});

