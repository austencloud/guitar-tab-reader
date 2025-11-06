import { describe, expect, it } from 'vitest';
import { stretchChordLyrics } from './chordLayout';

describe('stretchChordLyrics', () => {
	it('combines consecutive chord/lyric pairs when width allows', () => {
		const input = `[Verse 1]
Em7      G
Today is gonna be the day
             Dsus4                  A7sus4
That they're gonna throw it back to you,`;

		const result = stretchChordLyrics(input, { targetWidth: 120 });

		expect(result).toBe(`[Verse 1]
Em7      G                             Dsus4                  A7sus4
Today is gonna be the day That they're gonna throw it back to you,`);
	});

	it('keeps original layout when target width is too small', () => {
		const input = `Em7      G
Today is gonna be the day
             Dsus4                  A7sus4
That they're gonna throw it back to you,`;

		const result = stretchChordLyrics(input, { targetWidth: 40 });

		expect(result).toBe(input);
	});

	it('does not modify instrument tab lines', () => {
		const input = `e|-------------------------|
B|-------------------------|
G|-------------------------|`;

		expect(stretchChordLyrics(input)).toBe(input);
	});

	it('preserves indentation for chord blocks', () => {
		const input = `    Em7      G
    Today is gonna be the day
    Dsus4                  A7sus4
    That they're gonna throw it back to you,`;

		const result = stretchChordLyrics(input, { targetWidth: 120 });

		expect(result).toBe(`    Em7      G                Dsus4                  A7sus4
    Today is gonna be the day That they're gonna throw it back to you,`);
	});

	it('skips stretching when chord line contains bar separators', () => {
		const input = `Em7 | G
Today is gonna be the day
Dsus4 | A7sus4
That they're gonna throw it back to you,`;

		expect(stretchChordLyrics(input)).toBe(input);
	});

	it('handles slash chords and maintains alignment', () => {
		const input = `C        G/B
When you walk through a storm
Am       F/C
Hold your head up high`;

		const result = stretchChordLyrics(input, { targetWidth: 120 });

		expect(result).toBe(`C        G/B                  Am       F/C
When you walk through a storm Hold your head up high`);
	});

	it('avoids inserting joiner before punctuation', () => {
		const input = `G
Hello,
C
world!`;

		const result = stretchChordLyrics(input, { targetWidth: 80 });

		expect(result).toBe(`G      C
Hello, world!`);
	});

	it('combines multiple pairs while preserving chord offsets', () => {
		const input = `C        G
Happy birthday to
F        C
you`;

		const result = stretchChordLyrics(input, { targetWidth: 120 });

		expect(result).toBe(`C        G        F        C
Happy birthday to you`);
	});

	it('keeps chords aligned with their lyric anchors after stretching', () => {
		const input = `Dm       G
Take the ribbon from your hair
C        F
Shake it loose and let it fall`;

		const result = stretchChordLyrics(input, { targetWidth: 120 });
		const [chordLine, lyricLine] = result.split('\n');

		const anchor = lyricLine.indexOf('Shake it loose and let it fall');
		const chordIndex = chordLine.indexOf('C');

		expect(anchor).not.toBe(-1);
		expect(chordIndex).toBe(anchor);
	});
});
