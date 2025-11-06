export interface StretchOptions {
	targetWidth?: number;
	joiner?: string;
}

interface ChordToken {
	name: string;
	index: number;
}

interface PairBlock {
	indent: number;
	chords: ChordToken[];
	lyric: string;
	lyricTrimmed: string;
	originalChord: string;
	originalLyric: string;
	hasBarSeparators: boolean;
}

const DEFAULT_TARGET_WIDTH = 96;
const DEFAULT_JOINER = ' ';
const CHORD_TOKEN_REGEX =
	/^(?:[A-G](?:b|#)?(?:maj|min|m|dim|aug|sus[24]?|add\d|m?7|m?9|m?11|m?13|6|5)*)((?:\/[A-G](?:b|#)?)?)$/;

/**
 * Stretch chord/lyric pairs so they occupy more horizontal space while keeping alignment.
 * The algorithm looks for alternating chord lines and lyric lines and combines adjacent pairs
 * until the projected lyric width would exceed the configured target.
 */
export function stretchChordLyrics(
	content: string,
	options: StretchOptions = {}
): string {
	if (!content.trim()) return content;

	const lines = content.split('\n');
	const targetWidth = options.targetWidth ?? DEFAULT_TARGET_WIDTH;
	const joiner = options.joiner ?? DEFAULT_JOINER;
	const output: string[] = [];

	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		const nextLine = lines[index + 1] ?? '';

		if (isChordLine(line) && isLyricCandidate(nextLine)) {
			let pairs: PairBlock[] = [];
			let brokeEarly = false;

			while (index < lines.length - 1) {
				const chordLine = lines[index];
				const lyricLine = lines[index + 1] ?? '';

				if (!isChordLine(chordLine) || !isLyricCandidate(lyricLine)) {
					break;
				}

				const pair = createPairBlock(chordLine, lyricLine);

				if (pair.chords.length === 0 || pair.hasBarSeparators) {
					if (pairs.length > 0) {
						renderPairs(output, pairs, targetWidth, joiner);
						pairs = [];
					}
					output.push(pair.originalChord);
					output.push(pair.originalLyric);
					index += 2;
					brokeEarly = true;
					break;
				}

				pairs.push(pair);
				index += 2;

				if (index >= lines.length - 1) break;
				const lookahead = lines[index];
				const lookaheadNext = lines[index + 1] ?? '';
				if (!isChordLine(lookahead) || !isLyricCandidate(lookaheadNext)) {
					break;
				}
			}

			if (pairs.length > 0) {
				renderPairs(output, pairs, targetWidth, joiner);
			}

			continue;
		}

		output.push(line);
		index++;
	}

	return output.join('\n');
}

function renderPairs(
	output: string[],
	pairs: PairBlock[],
	targetWidth: number,
	joiner: string
) {
	const groups = groupPairs(pairs, targetWidth, joiner);

	for (const group of groups) {
		if (group.length === 1) {
			const pair = group[0];
			output.push(pair.originalChord);
			output.push(pair.originalLyric);
			continue;
		}

		const indent = ' '.repeat(group[0].indent);
		let lyricContent = '';
		const chordLine: string[] = [];

		for (const pair of group) {
			const segment = pair.lyricTrimmed;
			const joinSegment = lyricContent
				? determineJoiner(lyricContent, segment, joiner)
				: '';

			if (joinSegment) {
				lyricContent += joinSegment;
			}

			const baseOffset = lyricContent.length;
			lyricContent += segment;

			for (const chord of pair.chords) {
				const chordStart = baseOffset + chord.index;
				writeChordToken(chordLine, chordStart, chord.name);
			}
		}

		const lyricLine = indent + lyricContent;
		const chordString = indent + rtrimArray(chordLine);

		output.push(chordString);
		output.push(lyricLine);
	}
}

function groupPairs(
	pairs: PairBlock[],
	targetWidth: number,
	joiner: string
): PairBlock[][] {
	const groups: PairBlock[][] = [];
	let currentGroup: PairBlock[] = [];
	let currentWidth = 0;

	for (const pair of pairs) {
		const segmentWidth = pair.lyricTrimmed.length;

		if (currentGroup.length === 0) {
			currentGroup.push(pair);
			currentWidth = segmentWidth;
			continue;
		}

		const prevSegment = currentGroup[currentGroup.length - 1].lyricTrimmed;
		const joinSegment = determineJoiner(prevSegment, pair.lyricTrimmed, joiner);
		const projectedWidth =
			currentWidth + joinSegment.length + segmentWidth;

		if (projectedWidth > targetWidth) {
			groups.push(currentGroup);
			currentGroup = [pair];
			currentWidth = segmentWidth;
		} else {
			currentGroup.push(pair);
			currentWidth = projectedWidth;
		}
	}

	if (currentGroup.length) {
		groups.push(currentGroup);
	}

	return groups;
}

function writeChordToken(target: string[], start: number, chord: string) {
	if (start < 0) return;

	for (let i = target.length; i < start; i++) {
		target[i] = ' ';
	}

	for (let i = 0; i < chord.length; i++) {
		target[start + i] = chord[i];
	}
}

function rtrimArray(value: string[]): string {
	let end = value.length;
	while (end > 0 && value[end - 1] === ' ') {
		end--;
	}
	return value.slice(0, end).join('');
}

function isChordLine(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) return false;
	if (/^[\[\(].*[\]\)]$/.test(trimmed)) return false;
	if (hasTabIndicators(trimmed)) return false;

	const sanitized = trimmed.replace(/\|/g, ' ').replace(/[-·•]/g, ' ');
	const tokens = sanitized.split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return false;

	const matches = tokens.filter((token) => CHORD_TOKEN_REGEX.test(token));
	return matches.length === tokens.length && matches.length <= 8;
}

function hasTabIndicators(line: string): boolean {
	const hyphenCount = (line.match(/-/g) || []).length;
	const pipeCount = (line.match(/\|/g) || []).length;
	if (pipeCount >= 2 && hyphenCount >= 2) return true;
	return /[0-9]/.test(line) && hyphenCount > 2;
}

function isLyricCandidate(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) return false;
	if (isChordLine(line)) return false;
	if (/^[\[\(].*[\]\)]$/.test(trimmed)) return false;
	return /[A-Za-z]/.test(trimmed);
}

function createPairBlock(chordLine: string, lyricLine: string): PairBlock {
	const chordIndent = countIndent(chordLine);
	const lyricIndent = countIndent(lyricLine);
	const indent = Math.min(chordIndent, lyricIndent);

	const chordBody = chordLine.slice(indent);
	const lyricBody = lyricLine.slice(indent);
	const lyricTrimmed = trimTrailingSpaces(lyricBody);

	return {
		indent,
		chords: parseChordTokens(chordBody),
		lyric: lyricBody,
		lyricTrimmed,
		originalChord: chordLine,
		originalLyric: lyricLine,
		hasBarSeparators: chordBody.includes('|')
	};
}

function parseChordTokens(line: string): ChordToken[] {
	const tokens: ChordToken[] = [];
	let index = 0;

	while (index < line.length) {
		if (line[index] === ' ') {
			index++;
			continue;
		}

		const start = index;
		while (index < line.length && line[index] !== ' ') {
			index++;
		}

		const token = line.slice(start, index);
		if (CHORD_TOKEN_REGEX.test(token)) {
			tokens.push({ name: token, index: start });
		}
	}

	return tokens;
}

function determineJoiner(prev: string, next: string, joiner: string): string {
	if (!prev || !next) return '';
	if (prev.endsWith(' ') || prev.endsWith('-')) return '';
	if (next.startsWith(' ') || /^[,.;:'"!?)]/.test(next)) return '';
	return joiner;
}

function trimTrailingSpaces(value: string): string {
	let end = value.length;
	while (end > 0 && value[end - 1] === ' ') {
		end--;
	}
	return value.slice(0, end);
}

function countIndent(line: string): number {
	let count = 0;
	while (count < line.length && line[count] === ' ') {
		count++;
	}
	return count;
}
