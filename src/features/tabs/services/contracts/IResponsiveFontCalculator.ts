/**
 * Responsive font calculator service contract
 * Handles calculating optimal font sizes based on container width and content
 */
export interface IResponsiveFontCalculator {
	/**
	 * Calculate the maximum safe font size that prevents horizontal overflow
	 * @param content - Tab content to analyze
	 * @param containerWidth - Width of the container in pixels
	 * @param currentFontSize - Current font size preference
	 * @returns Maximum safe font size in pixels
	 */
	calculateMaxSafeFontSize(
		content: string,
		containerWidth: number,
		currentFontSize: number
	): number;

	/**
	 * Calculate the responsive font size (user preference limited by max safe size)
	 * @param userPreferredSize - User's preferred font size
	 * @param maxSafeSize - Maximum safe font size
	 * @param minSize - Minimum allowed font size (default: 8)
	 * @returns Constrained font size in pixels
	 */
	calculateResponsiveFontSize(
		userPreferredSize: number,
		maxSafeSize: number,
		minSize?: number
	): number;

	/**
	 * Calculate font size change from pinch gesture
	 * @param initialDistance - Initial pinch distance in pixels
	 * @param currentDistance - Current pinch distance in pixels
	 * @param initialFontSize - Font size at start of pinch
	 * @param maxSafeSize - Maximum safe font size
	 * @param minSize - Minimum allowed font size (default: 8)
	 * @returns New font size in pixels
	 */
	calculatePinchFontSize(
		initialDistance: number,
		currentDistance: number,
		initialFontSize: number,
		maxSafeSize: number,
		minSize?: number
	): number;
}

