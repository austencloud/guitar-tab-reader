<script lang="ts">
	import type { StringDefinition } from '../services/types';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import NoteInfoDisplay from './NoteInfoDisplay.svelte';
	import MeterDisplay from './MeterDisplay.svelte';
	import StringButtons from './StringButtons.svelte';

	interface Props {
		detectedCents?: number;
		closestString?: StringDefinition | null;
		strings?: StringDefinition[];
		statusMessage?: string;
	}

	let {
		detectedCents = 0,
		closestString = null,
		strings = [],
		statusMessage = ''
	}: Props = $props();

	const TUNED_THRESHOLD = 10;

	const needleRotation = tweened(0, {
		duration: 300,
		easing: cubicOut
	});

	let mounted = $state(false);
	let lastDetectedCents = $state(0);

	const isCurrentlyTuned = $derived(!!(closestString && Math.abs(detectedCents) < TUNED_THRESHOLD));

	$effect(() => {
		if (mounted) {
			if (isCurrentlyTuned) {
				needleRotation.set(0, { duration: 100 });
				lastDetectedCents = 0;
			} else if (closestString) {
				const targetRotation = Math.max(-45, Math.min(45, detectedCents));
				if (Math.abs(detectedCents - lastDetectedCents) > 1) {
					needleRotation.set(targetRotation);
					lastDetectedCents = detectedCents;
				}
			} else {
				needleRotation.set(0);
				lastDetectedCents = 0;
			}
		}
	});

	const tuningState = $derived(
		isCurrentlyTuned ? 'perfect' : getTuningState(closestString ? detectedCents : lastDetectedCents)
	);

	function getTuningState(cents: number) {
		const absCents = Math.abs(cents);
		if (absCents < TUNED_THRESHOLD + 5) return 'perfect';
		if (cents < 0) return 'flat';
		return 'sharp';
	}

	function playReferenceNote(string: StringDefinition) {
		const audioContext = new (window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.type = 'sine';
		oscillator.frequency.value = string.frequency;

		gainNode.gain.setValueAtTime(0, audioContext.currentTime);
		gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.start();

		gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + 0.5);
		gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);

		setTimeout(() => {
			oscillator.stop();
			oscillator.disconnect();
			gainNode.disconnect();
			if (audioContext.state !== 'closed') {
				audioContext.close();
			}
		}, 1500);
	}

	onMount(() => {
		mounted = true;
	});
</script>

<div class="tuning-meter {tuningState}">
	<NoteInfoDisplay {closestString} {statusMessage} {isCurrentlyTuned} />

	<MeterDisplay
		detectedCents={closestString ? detectedCents : 0}
		{isCurrentlyTuned}
		needleRotationStore={needleRotation}
	/>

	<StringButtons {strings} {closestString} onplayNote={(string) => playReferenceNote(string)} />
</div>

<style>
	.tuning-meter {
		--flat-color: #2196f3;
		--in-tune-color: #4caf50;
		--sharp-color: #f44336;

		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: min(400px, 90vw);
		margin: 0 auto;

		/* Responsive padding for mobile */
		padding: clamp(0.75rem, 3vw, 1.5rem);
		padding-bottom: clamp(1rem, 3vw, 1.5rem);

		border-radius: clamp(12px, 3vw, 16px);

		/* Modern 2025 glassmorphism design */
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.08),
			rgba(255, 255, 255, 0.03)
		);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);

		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.1),
			inset 0 1px 1px rgba(255, 255, 255, 0.1);

		transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.tuning-meter.perfect {
		box-shadow:
			0 8px 40px rgba(76, 175, 80, 0.25),
			0 0 60px rgba(76, 175, 80, 0.1),
			inset 0 1px 2px rgba(255, 255, 255, 0.15);
		border-color: rgba(76, 175, 80, 0.3);
		background: linear-gradient(
			135deg,
			rgba(76, 175, 80, 0.08),
			rgba(76, 175, 80, 0.03)
		);
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.tuning-meter {
			background: linear-gradient(
				135deg,
				rgba(30, 30, 30, 0.85),
				rgba(20, 20, 20, 0.85)
			);
			box-shadow:
				0 8px 32px rgba(0, 0, 0, 0.4),
				inset 0 1px 1px rgba(255, 255, 255, 0.05);
			border-color: rgba(255, 255, 255, 0.08);
		}

		.tuning-meter.perfect {
			background: linear-gradient(
				135deg,
				rgba(76, 175, 80, 0.12),
				rgba(76, 175, 80, 0.06)
			);
			border-color: rgba(76, 175, 80, 0.4);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.tuning-meter {
			max-width: 95vw;
			padding: 0.875rem 0.75rem 1rem;
			border-radius: 14px;
		}
	}

	/* Extra small devices */
	@media (max-width: 360px) {
		.tuning-meter {
			max-width: 98vw;
			padding: 0.75rem 0.625rem 0.875rem;
			border-radius: 12px;
		}
	}

	/* Landscape mode - more compact */
	@media (max-height: 600px) and (orientation: landscape) {
		.tuning-meter {
			padding: 0.5rem 1rem 0.75rem;
			max-width: 85vw;
		}
	}
</style>
