import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chords = require('@tombatossals/chords-db/lib/guitar.json');

// Find G major chord
const gChord = chords.chords.G.find(c => c.suffix === 'major');

if (gChord) {
	console.log('G major positions:', gChord.positions.length);
	console.log('\n=== Position 3 (index 2) ===');
	const pos3 = gChord.positions[2];
	console.log('Frets:', pos3.frets);
	console.log('Fingers:', pos3.fingers);
	console.log('Barres:', pos3.barres);
	console.log('BaseFret:', pos3.baseFret);
	
	// Check if there are multiple strings on the same fret
	const fretCounts = {};
	pos3.frets.forEach((fret, idx) => {
		if (fret > 0) {
			if (!fretCounts[fret]) fretCounts[fret] = [];
			fretCounts[fret].push(idx);
		}
	});
	
	console.log('\nFret analysis:');
	Object.entries(fretCounts).forEach(([fret, strings]) => {
		console.log(`  Fret ${fret}: strings ${strings.join(', ')} (${strings.length} strings)`);
		if (strings.length > 1) {
			console.log(`    -> Potential barre!`);
		}
	});
}

