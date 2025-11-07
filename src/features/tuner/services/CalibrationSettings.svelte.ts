/**
 * A4 Calibration Settings using Svelte 5 runes
 */

import { browser } from '$app/environment';

const CALIBRATION_STORAGE_KEY = 'tuner-a4-calibration';

export type A4Frequency = 432 | 440 | 443;

export const CALIBRATION_OPTIONS: { value: A4Frequency; label: string; description: string }[] = [
	{ value: 432, label: '432 Hz', description: 'Scientific/Healing tuning' },
	{ value: 440, label: '440 Hz', description: 'Standard concert pitch' },
	{ value: 443, label: '443 Hz', description: 'European orchestral tuning' }
];

function loadCalibration(): A4Frequency {
	if (!browser) return 440;

	try {
		const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
		if (stored) {
			const parsed = parseInt(stored, 10);
			if (parsed === 432 || parsed === 440 || parsed === 443) {
				return parsed as A4Frequency;
			}
		}
	} catch {
		// localStorage not available
	}

	return 440; // Default to standard concert pitch
}

function saveCalibration(freq: A4Frequency) {
	if (!browser) return;

	try {
		localStorage.setItem(CALIBRATION_STORAGE_KEY, freq.toString());
	} catch {
		// localStorage not available
	}
}

// Create reactive state for A4 calibration
let a4CalibrationValue = $state<A4Frequency>(loadCalibration());

export const a4Calibration = {
	get value() {
		return a4CalibrationValue;
	},
	set value(newValue: A4Frequency) {
		a4CalibrationValue = newValue;
		saveCalibration(newValue);
	},
	reset() {
		a4CalibrationValue = 440;
		saveCalibration(440);
	}
};

/**
 * Calculate frequency adjusted for calibration
 */
export function adjustFrequencyForCalibration(
	standardFrequency: number,
	calibration: A4Frequency = 440
): number {
	// Adjust frequency based on A4 calibration
	// Formula: freq_new = freq_standard * (A4_new / 440)
	return standardFrequency * (calibration / 440);
}

/**
 * Get calibration ratio
 */
export function getCalibrationRatio(calibration: A4Frequency = 440): number {
	return calibration / 440;
}
