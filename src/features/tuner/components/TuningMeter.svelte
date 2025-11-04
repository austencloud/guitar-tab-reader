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
		--flat-color: var(--color-info);
		--in-tune-color: var(--color-success);
		--sharp-color: var(--color-error);

		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		padding: var(--spacing-lg);
		border-radius: var(--radius-2xl);
		background: linear-gradient(
			to bottom,
			var(--color-surface),
			var(--color-surface-low)
		);
		box-shadow: var(--shadow-lg);
		transition: var(--transition-all);
		border: 1px solid var(--color-border);
	}

	.tuning-meter.perfect {
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}
</style>
