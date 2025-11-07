/**
 * Signal processing utilities for tuner enhancements
 */

/**
 * Exponential Moving Average filter for frequency smoothing
 */
export class ExponentialMovingAverage {
	private value: number | null = null;
	private readonly alpha: number;

	/**
	 * @param smoothingFactor - Between 0 and 1. Lower = smoother but slower response (default: 0.3)
	 */
	constructor(smoothingFactor: number = 0.3) {
		this.alpha = Math.max(0, Math.min(1, smoothingFactor));
	}

	update(newValue: number): number {
		if (this.value === null) {
			this.value = newValue;
		} else {
			this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
		}
		return this.value;
	}

	reset(): void {
		this.value = null;
	}

	get current(): number | null {
		return this.value;
	}
}

/**
 * Calculate RMS (Root Mean Square) for signal strength measurement
 */
export function calculateRMS(buffer: Float32Array): number {
	let sum = 0;
	for (let i = 0; i < buffer.length; i++) {
		sum += buffer[i] * buffer[i];
	}
	return Math.sqrt(sum / buffer.length);
}

/**
 * Adaptive clarity threshold based on signal strength
 */
export class AdaptiveClarityThreshold {
	private baseThreshold: number;
	private signalHistory: number[] = [];
	private readonly historySize: number = 30; // ~0.5 seconds at 60fps

	constructor(baseThreshold: number = 0.8) {
		this.baseThreshold = baseThreshold;
	}

	/**
	 * Get adjusted clarity threshold based on recent signal strength
	 */
	getThreshold(currentRMS: number): number {
		this.signalHistory.push(currentRMS);
		if (this.signalHistory.length > this.historySize) {
			this.signalHistory.shift();
		}

		// Calculate average signal strength
		const avgSignal = this.signalHistory.reduce((a, b) => a + b, 0) / this.signalHistory.length;

		// Strong signal: slightly lower threshold for faster response
		// Weak signal: higher threshold to avoid noise
		if (avgSignal > 0.1) {
			return this.baseThreshold * 0.95; // 5% easier
		} else if (avgSignal < 0.02) {
			return this.baseThreshold * 1.1; // 10% stricter
		}

		return this.baseThreshold;
	}

	reset(): void {
		this.signalHistory = [];
	}
}

/**
 * Signal strength classification
 */
export type SignalStrength = 'too-quiet' | 'quiet' | 'good' | 'loud' | 'too-loud';

export function getSignalStrength(rms: number): SignalStrength {
	if (rms < 0.01) return 'too-quiet';
	if (rms < 0.03) return 'quiet';
	if (rms < 0.3) return 'good';
	if (rms < 0.6) return 'loud';
	return 'too-loud';
}

/**
 * Get normalized signal strength as percentage (0-100)
 */
export function getSignalStrengthPercentage(rms: number): number {
	// Optimal range is 0.03 to 0.3
	const normalized = Math.max(0, Math.min(1, (rms - 0.01) / 0.29));
	return Math.round(normalized * 100);
}
