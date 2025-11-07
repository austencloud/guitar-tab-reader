/**
 * Signal processing utilities for tuner enhancements
 */
/**
 * Exponential Moving Average filter for frequency smoothing
 */
export declare class ExponentialMovingAverage {
    private value;
    private readonly alpha;
    /**
     * @param smoothingFactor - Between 0 and 1. Lower = smoother but slower response (default: 0.3)
     */
    constructor(smoothingFactor?: number);
    update(newValue: number): number;
    reset(): void;
    get current(): number | null;
}
/**
 * Calculate RMS (Root Mean Square) for signal strength measurement
 */
export declare function calculateRMS(buffer: Float32Array): number;
/**
 * Adaptive clarity threshold based on signal strength
 */
export declare class AdaptiveClarityThreshold {
    private baseThreshold;
    private signalHistory;
    private readonly historySize;
    constructor(baseThreshold?: number);
    /**
     * Get adjusted clarity threshold based on recent signal strength
     */
    getThreshold(currentRMS: number): number;
    reset(): void;
}
/**
 * Signal strength classification
 */
export type SignalStrength = 'too-quiet' | 'quiet' | 'good' | 'loud' | 'too-loud';
export declare function getSignalStrength(rms: number): SignalStrength;
/**
 * Get normalized signal strength as percentage (0-100)
 */
export declare function getSignalStrengthPercentage(rms: number): number;
