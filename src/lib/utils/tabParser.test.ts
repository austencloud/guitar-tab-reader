import { describe, it, expect } from 'vitest';
import { parseTab } from './tabParser';

describe('parseTab', () => {
	it('should parse basic tab structure', () => {
		const tabText = `
e|--0--2--3--|
B|--1--3--0--|
G|--0--2--0--|
D|--2--0--0--|
A|--3--x--2--|
E|--x--x--3--|
		`.trim();

		const result = parseTab(tabText);

		expect(result).toBeDefined();
		expect(result.sections).toHaveLength(1);
		expect(result.stringCount).toBe(6);
	});

	it('should handle empty input', () => {
		const result = parseTab('');
		expect(result.sections).toHaveLength(0);
	});

	it('should detect string count correctly', () => {
		const fourStringTab = `
G|--0--2--|
D|--2--0--|
A|--3--x--|
E|--x--x--|
		`.trim();

		const result = parseTab(fourStringTab);
		expect(result.stringCount).toBe(4);
	});

	it('should parse chord names', () => {
		const tabWithChords = `
    C       G       Am      F
e|--0-------3-------0-------1--|
B|--1-------0-------1-------1--|
G|--0-------0-------2-------2--|
D|--2-------0-------2-------3--|
A|--3-------2-------0-------3--|
E|--x-------3-------x-------1--|
		`.trim();

		const result = parseTab(tabWithChords);
		expect(result.sections).toHaveLength(1);
		expect(result.sections[0].chords).toBeDefined();
		expect(result.sections[0].chords?.length).toBeGreaterThan(0);
	});

	it('should handle tab with techniques', () => {
		const tabWithTechniques = `
e|--0h2p0--3b5r3--5/7\\5--|
B|--1-------0-------0-----|
G|--0-------0-------0-----|
D|--2-------0-------0-----|
A|--3-------2-------2-----|
E|--x-------3-------3-----|
		`.trim();

		const result = parseTab(tabWithTechniques);
		expect(result.sections).toHaveLength(1);
	});

	it('should parse multiple sections', () => {
		const multiSectionTab = `
Verse:
e|--0--2--3--|
B|--1--3--0--|

Chorus:
e|--3--2--0--|
B|--0--3--1--|
		`.trim();

		const result = parseTab(multiSectionTab);
		expect(result.sections.length).toBeGreaterThanOrEqual(1);
	});
});
