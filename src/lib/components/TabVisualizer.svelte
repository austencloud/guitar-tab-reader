<script lang="ts">
	import { onMount } from 'svelte';
	import { parseTab, getChordDiagram, type ParsedTab } from '../utils/tabParser';

	export let content: string;
	export let fontSize: number = 14;
	export let showChordDiagrams: boolean = true;
	export let currentPosition: number = 0;

	let container: HTMLDivElement;
	let svgContainer: HTMLDivElement;
	let parsedTab: ParsedTab;
	let tabWidth = 0;
	let tabHeight = 0;
	let currentScrollPosition = 0;
	let viewportWidth = 0;
	let viewportHeight = 0;
	let noteElements: SVGRectElement[] = [];
	let stringSpacing = 0;
	let xScale = 0.5; // Units per character

	// Colors for strings
	const stringColors = [
		'#e74c3c', // E (1st string) - red
		'#f39c12', // B - orange
		'#2ecc71', // G - green
		'#3498db', // D - blue
		'#9b59b6', // A - purple
		'#34495e' // E (6th string) - dark blue
	];

	// Maps for technique colors and symbols
	const techniqueColors = {
		h: '#2ecc71', // hammer-on - green
		p: '#e74c3c', // pull-off - red
		b: '#f39c12', // bend - orange
		'/': '#3498db', // slide up - blue
		'\\': '#9b59b6', // slide down - purple
		'~': '#f1c40f' // vibrato - yellow
	};

	// Explicitly expose the container element to parent components
	export { container };

	$: if (content) {
		parsedTab = parseTab(content);
	}

	$: if (parsedTab && svgContainer) {
		updateTabVisualization();
	}

	$: if (currentPosition !== undefined && noteElements.length > 0) {
		highlightCurrentPosition();
	}

	onMount(() => {
		// Set up resize observer to handle viewport changes
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === svgContainer) {
					viewportWidth = entry.contentRect.width;
					viewportHeight = entry.contentRect.height;
					updateTabVisualization();
				}
			}
		});

		if (svgContainer) {
			resizeObserver.observe(svgContainer);
			viewportWidth = svgContainer.clientWidth;
			viewportHeight = svgContainer.clientHeight;
		}

		// Parse the tab content
		parsedTab = parseTab(content);
		updateTabVisualization();

		return () => {
			if (svgContainer) resizeObserver.unobserve(svgContainer);
		};
	});

	function updateTabVisualization() {
		if (!parsedTab || !svgContainer) return;

		// Clear the container
		svgContainer.innerHTML = '';

		// Calculate dimensions
		const { stringCount, sections } = parsedTab;
		stringSpacing = Math.max(fontSize * 1.5, 20);

		// Determine total width based on the longest section
		let maxLength = 0;
		sections.forEach((section) => {
			section.lines.forEach((line) => {
				maxLength = Math.max(maxLength, line.length);
			});
		});

		tabWidth = maxLength * xScale * fontSize;
		tabHeight = (sections.length * (stringCount + 3) + 10) * stringSpacing;

		// Create SVG element
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', `${tabWidth}px`);
		svg.setAttribute('height', `${tabHeight}px`);
		svg.setAttribute('viewBox', `0 0 ${tabWidth} ${tabHeight}`);
		svg.setAttribute('role', 'img');
		svg.setAttribute('aria-label', 'Guitar Tab Visualization');

		// Add sections
		let yOffset = stringSpacing; // Starting Y position
		noteElements = [];

		sections.forEach((section, sectionIndex) => {
			// Add section title if available
			if (section.title) {
				const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				titleText.textContent = section.title;
				titleText.setAttribute('x', '10');
				titleText.setAttribute('y', `${yOffset}`);
				titleText.setAttribute('font-size', `${fontSize * 1.2}px`);
				titleText.setAttribute('font-weight', 'bold');
				svg.appendChild(titleText);
				yOffset += stringSpacing;
			}

			// Add string names
			parsedTab.stringNames.forEach((name, i) => {
				const stringText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				stringText.textContent = name;
				stringText.setAttribute('x', '5');
				stringText.setAttribute('y', `${yOffset + i * stringSpacing}`);
				stringText.setAttribute('font-size', `${fontSize}px`);
				stringText.setAttribute('alignment-baseline', 'middle');
				stringText.setAttribute('text-anchor', 'end');
				stringText.setAttribute('fill', stringColors[i % stringColors.length]);
				svg.appendChild(stringText);
			});

			// Draw strings
			for (let i = 0; i < stringCount; i++) {
				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', '10');
				line.setAttribute('y1', `${yOffset + i * stringSpacing}`);
				line.setAttribute('x2', `${tabWidth - 10}`);
				line.setAttribute('y2', `${yOffset + i * stringSpacing}`);
				line.setAttribute('stroke', stringColors[i % stringColors.length]);
				line.setAttribute('stroke-width', '1');
				svg.appendChild(line);
			}

			// Add measures and notes
			section.positions.forEach((pos) => {
				const x = 10 + pos.position * fontSize * xScale;

				// Add measure line
				if (pos.isMeasureLine) {
					const measureLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
					measureLine.setAttribute('x1', `${x}`);
					measureLine.setAttribute('y1', `${yOffset - stringSpacing / 2}`);
					measureLine.setAttribute('x2', `${x}`);
					measureLine.setAttribute(
						'y2',
						`${yOffset + (stringCount - 1) * stringSpacing + stringSpacing / 2}`
					);
					measureLine.setAttribute('stroke', '#777');
					measureLine.setAttribute('stroke-width', '2');
					svg.appendChild(measureLine);
				}

				// Add notes
				pos.notes.forEach((note, stringIndex) => {
					const y = yOffset + stringIndex * stringSpacing;

					// Draw note circle/rectangle
					const noteRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
					noteRect.setAttribute('x', `${x - fontSize / 2}`);
					noteRect.setAttribute('y', `${y - fontSize / 2}`);
					noteRect.setAttribute('width', `${fontSize}`);
					noteRect.setAttribute('height', `${fontSize}`);
					noteRect.setAttribute('rx', '3');
					noteRect.setAttribute('ry', '3');
					noteRect.setAttribute('fill', stringColors[stringIndex % stringColors.length]);
					noteRect.dataset.position = pos.position.toString();
					noteElements.push(noteRect);
					svg.appendChild(noteRect);

					// Add fret number text
					const fretText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
					fretText.textContent = note.fret.toString();
					fretText.setAttribute('x', `${x}`);
					fretText.setAttribute('y', `${y + fontSize / 4}`);
					fretText.setAttribute('font-size', `${fontSize * 0.8}px`);
					fretText.setAttribute('fill', 'white');
					fretText.setAttribute('text-anchor', 'middle');
					svg.appendChild(fretText);

					// Add technique indicator if present
					if (note.technique) {
						const techniqueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
						techniqueText.textContent = note.technique;
						techniqueText.setAttribute('x', `${x + fontSize}`);
						techniqueText.setAttribute('y', `${y}`);
						techniqueText.setAttribute('font-size', `${fontSize * 0.8}px`);
						techniqueText.setAttribute('fill', techniqueColors[note.technique.charAt(0) as keyof typeof techniqueColors] || '#777');
						svg.appendChild(techniqueText);

						// Draw line for hammer-ons, pull-offs, slides
						if (
							['h', 'p', '/', '\\'].includes(note.technique) &&
							note.techniqueFret !== undefined
						) {
							const endX = x + fontSize * 2;

							const techLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
							techLine.setAttribute(
								'd',
								`M ${x + fontSize / 2} ${y} C ${x + fontSize} ${y - stringSpacing / 2}, ${endX - fontSize} ${y - stringSpacing / 2}, ${endX} ${y}`
							);
							techLine.setAttribute('stroke', techniqueColors[note.technique as keyof typeof techniqueColors] || '#777');
							techLine.setAttribute('stroke-width', '2');
							techLine.setAttribute('fill', 'transparent');
							svg.appendChild(techLine);

							// Add target fret number
							const targetText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
							targetText.textContent = note.techniqueFret.toString();
							targetText.setAttribute('x', `${endX}`);
							targetText.setAttribute('y', `${y - stringSpacing / 3}`);
							targetText.setAttribute('font-size', `${fontSize * 0.7}px`);
							targetText.setAttribute('fill', techniqueColors[note.technique as keyof typeof techniqueColors] || '#777');
							svg.appendChild(targetText);
						}
						// Draw bend
						else if (note.technique.startsWith('b')) {
							const bendHeight = stringSpacing;
							const bendPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
							bendPath.setAttribute(
								'd',
								`M ${x + fontSize / 2} ${y} Q ${x + fontSize} ${y - bendHeight}, ${x + fontSize * 1.5} ${y - bendHeight}`
							);
							bendPath.setAttribute('stroke', techniqueColors['b']);
							bendPath.setAttribute('stroke-width', '2');
							bendPath.setAttribute('fill', 'transparent');
							svg.appendChild(bendPath);

							// Add bend amount (if available)
							const bendAmount = note.technique.substring(1) || '1';
							const bendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
							bendText.textContent = bendAmount;
							bendText.setAttribute('x', `${x + fontSize * 1.5}`);
							bendText.setAttribute('y', `${y - bendHeight - 5}`);
							bendText.setAttribute('font-size', `${fontSize * 0.7}px`);
							bendText.setAttribute('text-anchor', 'middle');
							bendText.setAttribute('fill', techniqueColors['b']);
							svg.appendChild(bendText);
						}
						// Draw vibrato
						else if (note.technique === '~') {
							const vibratoPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
							vibratoPath.setAttribute(
								'd',
								`M ${x + fontSize / 2} ${y} 
                              q 2 -3, 4 0 t 4 0 t 4 0 t 4 0`
							);
							vibratoPath.setAttribute('stroke', techniqueColors['~']);
							vibratoPath.setAttribute('stroke-width', '1.5');
							vibratoPath.setAttribute('fill', 'transparent');
							svg.appendChild(vibratoPath);
						}
					}
				});
			});

			// Add chord names
			section.chords.forEach((chord) => {
				const chordX = 10 + chord.position * fontSize * xScale;
				const chordText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				chordText.textContent = chord.name;
				chordText.setAttribute('x', `${chordX}`);
				chordText.setAttribute('y', `${yOffset - stringSpacing}`);
				chordText.setAttribute('font-size', `${fontSize}px`);
				chordText.setAttribute('font-weight', 'bold');
				chordText.setAttribute('fill', '#333');
				svg.appendChild(chordText);

				// Add chord diagram if enabled
				if (showChordDiagrams) {
					const chordDiagram = getChordDiagram(chord.name);
					if (chordDiagram) {
						// Draw chord diagram
						const diagramX = chordX;
						const diagramY = yOffset - stringSpacing * 5;
						const diagramWidth = fontSize * 5;
						const diagramHeight = fontSize * 6;
						const fretSpacing = diagramHeight / 5;
						const stringSpacingDiagram = diagramWidth / 5;

						// Background rectangle
						const diagramBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
						diagramBg.setAttribute('x', `${diagramX - 5}`);
						diagramBg.setAttribute('y', `${diagramY - 5}`);
						diagramBg.setAttribute('width', `${diagramWidth + 10}`);
						diagramBg.setAttribute('height', `${diagramHeight + 10}`);
						diagramBg.setAttribute('rx', '5');
						diagramBg.setAttribute('ry', '5');
						diagramBg.setAttribute('fill', 'rgba(255,255,255,0.8)');
						diagramBg.setAttribute('stroke', '#ccc');
						svg.appendChild(diagramBg);

						// Horizontal lines (frets)
						for (let i = 0; i <= 5; i++) {
							const fretLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
							fretLine.setAttribute('x1', `${diagramX}`);
							fretLine.setAttribute('y1', `${diagramY + i * fretSpacing}`);
							fretLine.setAttribute('x2', `${diagramX + diagramWidth}`);
							fretLine.setAttribute('y2', `${diagramY + i * fretSpacing}`);
							fretLine.setAttribute('stroke', i === 0 ? '#000' : '#666');
							fretLine.setAttribute('stroke-width', i === 0 ? '2' : '1');
							svg.appendChild(fretLine);
						}

						// Vertical lines (strings)
						for (let i = 0; i < 6; i++) {
							const stringLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
							stringLine.setAttribute('x1', `${diagramX + i * stringSpacingDiagram}`);
							stringLine.setAttribute('y1', `${diagramY}`);
							stringLine.setAttribute('x2', `${diagramX + i * stringSpacingDiagram}`);
							stringLine.setAttribute('y2', `${diagramY + diagramHeight}`);
							stringLine.setAttribute('stroke', '#666');
							stringLine.setAttribute('stroke-width', '1');
							svg.appendChild(stringLine);
						}

						// Add finger positions
						chordDiagram.positions.forEach((fret, stringIndex) => {
							if (fret >= 0) {
								const dotX = diagramX + (5 - stringIndex) * stringSpacingDiagram;
								const dotY = diagramY + (fret === 0 ? 0 : fret * fretSpacing - fretSpacing / 2);

								const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
								dot.setAttribute('cx', `${dotX}`);
								dot.setAttribute('cy', `${dotY}`);
								dot.setAttribute('r', `${fontSize / 3}`);
								dot.setAttribute('fill', fret === 0 ? 'transparent' : '#333');
								dot.setAttribute('stroke', fret === 0 ? '#000' : 'none');
								dot.setAttribute('stroke-width', '1');
								svg.appendChild(dot);
							} else {
								// X for muted strings
								const x = diagramX + (5 - stringIndex) * stringSpacingDiagram;
								const y = diagramY - fretSpacing / 2;

								const xMark1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
								xMark1.setAttribute('x1', `${x - fontSize / 4}`);
								xMark1.setAttribute('y1', `${y - fontSize / 4}`);
								xMark1.setAttribute('x2', `${x + fontSize / 4}`);
								xMark1.setAttribute('y2', `${y + fontSize / 4}`);
								xMark1.setAttribute('stroke', '#000');
								xMark1.setAttribute('stroke-width', '2');
								svg.appendChild(xMark1);

								const xMark2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
								xMark2.setAttribute('x1', `${x - fontSize / 4}`);
								xMark2.setAttribute('y1', `${y + fontSize / 4}`);
								xMark2.setAttribute('x2', `${x + fontSize / 4}`);
								xMark2.setAttribute('y2', `${y - fontSize / 4}`);
								xMark2.setAttribute('stroke', '#000');
								xMark2.setAttribute('stroke-width', '2');
								svg.appendChild(xMark2);
							}
						});

						// Draw barre if needed
						if (chordDiagram.barre !== undefined) {
							const barreY = diagramY + chordDiagram.barre * fretSpacing - fretSpacing / 2;
							const barStart = diagramX;
							let barEnd = diagramX;

							// Find the first and last string that uses this barre
							let firstString = -1,
								lastString = -1;
							chordDiagram.positions.forEach((fret, idx) => {
								if (fret === chordDiagram.barre) {
									if (firstString === -1) firstString = idx;
									lastString = idx;
								}
							});

							if (firstString >= 0 && lastString >= 0) {
								barEnd = diagramX + (5 - firstString) * stringSpacingDiagram;
								const barStart = diagramX + (5 - lastString) * stringSpacingDiagram;

								const barreRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
								barreRect.setAttribute('x', `${barStart - fontSize / 4}`);
								barreRect.setAttribute('y', `${barreY - fontSize / 4}`);
								barreRect.setAttribute('width', `${barEnd - barStart + fontSize / 2}`);
								barreRect.setAttribute('height', `${fontSize / 2}`);
								barreRect.setAttribute('rx', `${fontSize / 4}`);
								barreRect.setAttribute('fill', '#333');
								svg.appendChild(barreRect);
							}
						}
					}
				}
			});

			// Update yOffset for next section
			yOffset += stringCount * stringSpacing + stringSpacing * 2;
		});

		// Append the SVG to the container
		svgContainer.appendChild(svg);

		// Add scroll event listener to track current position
		container.addEventListener('scroll', handleScroll);
	}

	function handleScroll() {
		currentScrollPosition = container.scrollTop;
		// Calculate current position based on scroll position
		// (Implementation depends on how you want to map scroll position to tab position)
		highlightCurrentPosition();
	}

	function highlightCurrentPosition() {
		// Reset all notes to normal
		noteElements.forEach((el) => {
			el.setAttribute('stroke', 'none');
			el.setAttribute('stroke-width', '0');
		});

		// Find notes at or near current position and highlight them
		const highlightPos = Math.floor(currentPosition / (fontSize * xScale));
		noteElements.forEach((el) => {
			const pos = parseInt(el.dataset.position || '0');
			if (pos === highlightPos) {
				el.setAttribute('stroke', '#ff9800');
				el.setAttribute('stroke-width', '3');
				el.setAttribute('stroke-dasharray', '3,3');
				el.setAttribute('stroke-dashoffset', (Date.now() % 30).toString());
			}
		});
	}
</script>

<div class="tab-viewer" bind:this={container}>
	<div class="tab-svg-container" bind:this={svgContainer}></div>
</div>

<style>
	.tab-viewer {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: auto;
		background-color: #f5f5f5;
		border-radius: 4px;
		padding: 1rem;
	}

	.tab-svg-container {
		min-width: 100%;
		min-height: 100%;
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.tab-viewer {
			padding: 0.5rem;
			touch-action: pan-y;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.tab-viewer {
			background-color: #1e1e1e;
			color: #e0e0e0;
		}
	}
</style>
