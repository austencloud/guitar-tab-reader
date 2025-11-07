<script lang="ts">
	import { preferences } from '$lib/state/preferences.svelte';

	interface Props {
		name: string;
		positions?: number[];
		barre?: number | undefined;
		baseFret?: number;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, positions = [], barre = undefined, baseFret = 1, size = 'lg' }: Props = $props();

	// Size constants
	const sizes = {
		sm: {
			width: 70,
			height: 80,
			fontSize: 10,
			lineWidth: 1,
			dotRadius: 4,
			nutHeight: 4
		},
		md: {
			width: 100,
			height: 120,
			fontSize: 14,
			lineWidth: 1.5,
			dotRadius: 6,
			nutHeight: 6
		},
		lg: {
			width: 130,
			height: 160,
			fontSize: 16,
			lineWidth: 2,
			dotRadius: 8,
			nutHeight: 8
		}
	};

	// Get size values
	const currentSize = $derived(sizes[size]);

	// SVG dimensions
	const width = $derived(currentSize.width);
	const height = $derived(currentSize.height);
	const stringSpacing = $derived(width / 7);
	const fretSpacing = $derived((height - 20) / 6);

	// Display properties
	const showNut = $derived(baseFret === 1);
	const fretNumberY = $derived(fretSpacing);

	// Adjust positions based on handedness
	const displayPositions = $derived(
		preferences.isLeftHanded ? [...positions].reverse() : positions
	);
</script>

<div class="chord-diagram" style="--width: {width}px; --height: {height}px;">
	<div class="chord-name">{name}</div>
	<svg {width} {height} viewBox="-15 0 {width + 15} {height}" style="margin: 0 auto; display: block; overflow: visible;">
		<!-- Strings -->
		{#each Array(6) as _, i (i)}
			{@const x = stringSpacing + i * stringSpacing}
			{@const isThickString = preferences.isLeftHanded ? i === 5 : i === 0}
			{@const isThinString = preferences.isLeftHanded ? i === 0 : i === 5}
			<line
				x1={x}
				y1={10}
				x2={x}
				y2={height - 10}
				stroke="#555"
				stroke-width={isThickString
					? currentSize.lineWidth * 1.5
					: isThinString
						? currentSize.lineWidth * 1.3
						: currentSize.lineWidth}
			/>
		{/each}

		<!-- Frets -->
		{#each Array(6) as _, i (i)}
			{@const y = 10 + i * fretSpacing}
			<line
				x1={stringSpacing}
				y1={y}
				x2={width - stringSpacing}
				y2={y}
				stroke="#555"
				stroke-width={currentSize.lineWidth}
			/>
		{/each}

		<!-- Nut -->
		{#if showNut}
			<rect
				x={stringSpacing}
				y={10 - currentSize.nutHeight / 2}
				width={width - 2 * stringSpacing}
				height={currentSize.nutHeight}
				fill="#000"
			/>
		{:else}
			<!-- Fret number indicator - positioned left with better visibility -->
			<text
				x={0}
				y={fretNumberY + 5}
				fill="#ffffff"
				font-size={currentSize.fontSize}
				font-weight="bold"
				text-anchor="start"
				stroke="#000"
				stroke-width="0.5"
				paint-order="stroke">{baseFret}</text
			>
		{/if}

		<!-- Barre if present (draw first so it's behind other dots) -->
		{#if barre !== undefined}
			{@const barrePositions = displayPositions.map((p, i) => ({ pos: p, string: 5 - i }))}
			{@const barredStrings = barrePositions.filter((p) => p.pos === barre)}
			{#if barredStrings.length > 1}
				{@const firstString = Math.min(...barredStrings.map((s) => s.string))}
				{@const lastString = Math.max(...barredStrings.map((s) => s.string))}
				{@const barreWidth = (lastString - firstString) * stringSpacing}
				{@const barreY = 10 + (barre - 0.5) * fretSpacing}
				{@const barreX = stringSpacing + firstString * stringSpacing}
				<rect
					x={barreX}
					y={barreY - currentSize.dotRadius}
					width={barreWidth}
					height={currentSize.dotRadius * 2}
					fill="#1976d2"
					rx={currentSize.dotRadius}
					ry={currentSize.dotRadius}
				/>
			{/if}
		{/if}

		<!-- Finger positions (skip dots that are part of the barre) -->
		{#each displayPositions as position, i (i)}
			{@const stringIndex = 5 - i}
			{@const x = stringSpacing + stringIndex * stringSpacing}
			{@const isBarred = barre !== undefined && position === barre}
			{#if position > 0 && !isBarred}
				{@const y = 10 + (position - 0.5) * fretSpacing}
				<circle cx={x} cy={y} r={currentSize.dotRadius} fill="#1976d2" />
			{:else if position === 0}
				<circle
					cx={x}
					cy={5}
					r={currentSize.dotRadius / 2}
					fill="transparent"
					stroke="#000"
					stroke-width={currentSize.lineWidth}
				/>
			{:else if position < 0}
				<text
					{x}
					y={5}
					text-anchor="middle"
					dominant-baseline="middle"
					font-size={currentSize.fontSize}
					fill="#000">×</text
				>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.chord-diagram {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: var(--width);
		margin: 0 auto;
	}

	.chord-name {
		font-weight: bold;
		margin-bottom: 5px;
		text-align: center;
	}

	svg {
		display: block;
		margin: 0 auto;
	}

	/* Dark theme support */
	@media (prefers-color-scheme: dark) {
		.chord-name {
			color: #e0e0e0;
		}

		:global(.chord-diagram svg line) {
			stroke: #888;
		}

		:global(.chord-diagram svg text) {
			fill: #e0e0e0;
		}

		:global(.chord-diagram svg circle[stroke='#000']) {
			stroke: #e0e0e0;
		}
	}
</style>
