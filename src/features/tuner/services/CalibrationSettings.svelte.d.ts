/**
 * A4 Calibration Settings using Svelte 5 runes
 */
export type A4Frequency = 432 | 440 | 443;
export declare const CALIBRATION_OPTIONS: {
    value: A4Frequency;
    label: string;
    description: string;
}[];
export declare const a4Calibration: {
    value: A4Frequency;
    reset(): void;
};
/**
 * Calculate frequency adjusted for calibration
 */
export declare function adjustFrequencyForCalibration(standardFrequency: number, calibration?: A4Frequency): number;
/**
 * Get calibration ratio
 */
export declare function getCalibrationRatio(calibration?: A4Frequency): number;
