import type { IResponsiveFontCalculator } from '../contracts/IResponsiveFontCalculator';
/**
 * Responsive font calculator service implementation
 * Pure calculation logic with zero Svelte dependencies
 */
export declare class ResponsiveFontCalculator implements IResponsiveFontCalculator {
    private readonly CHAR_WIDTH_RATIO;
    private readonly MAX_FONT_SIZE;
    private readonly DEFAULT_MIN_SIZE;
    private readonly PINCH_SCALE_FACTOR;
    calculateMaxSafeFontSize(content: string, containerWidth: number, currentFontSize: number): number;
    calculateResponsiveFontSize(userPreferredSize: number, maxSafeSize: number, minSize?: number): number;
    calculatePinchFontSize(initialDistance: number, currentDistance: number, initialFontSize: number, maxSafeSize: number, minSize?: number): number;
}
