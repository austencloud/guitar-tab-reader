import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chords = require('@tombatossals/chords-db/lib/guitar.json');

// Find G major chord
const gChord = chords.chords.G.find(c => c.suffix === 'major');

console.log('G major chord positions:');
console.log('Total positions:', gChord.positions.length);
console.log('\nPosition 4 (index 3):');
console.log(JSON.stringify(gChord.positions[3], null, 2));

// Test the conversion logic
const position = gChord.positions[3];
console.log('\n--- Conversion Test ---');
console.log('frets:', position.frets);
console.log('baseFret:', position.baseFret);
console.log('barres:', position.barres);

// Simulate the conversion
const positions = position.frets;
console.log('\nDirect positions array:', positions);
console.log('Type of positions:', typeof positions);
console.log('Is array:', Array.isArray(positions));

