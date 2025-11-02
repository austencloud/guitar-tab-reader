# Phase 2: Advanced Tab Features

## Overview

**Duration**: 3 months  
**Priority**: High  
**Goal**: Implement custom chord formations and advanced editing capabilities

This phase transforms TabScroll from a basic tab viewer into a sophisticated tab management system with custom chord formations, song-specific defaults, and instance-specific overrides.

## Core Features

### 1. Custom Chord Formation System (Weeks 1-4)

#### 1.1 Chord Definition Architecture

**Goal**: Create flexible system for storing and managing chord variations

**Data Structure**:

```typescript
interface ChordFormation {
	id: string;
	name: string; // e.g., "E", "Em", "E7"
	positions: number[]; // Fret positions [0, 2, 2, 1, 0, 0]
	fingers?: number[]; // Finger assignments [0, 2, 3, 1, 0, 0]
	barre?: {
		fret: number;
		startString: number;
		endString: number;
	};
	baseFret?: number; // For higher position chords
	difficulty: 1 | 2 | 3 | 4 | 5;
	tags: string[]; // ['beginner', 'open', 'power']
	metadata: {
		creator?: string;
		source?: string;
		verified?: boolean;
		popularity?: number;
	};
}

interface ChordVariationSet {
	chordName: string;
	variations: ChordFormation[];
	defaultVariation: string; // ID of default formation
}
```

#### 1.2 Chord Registry System

**Goal**: Manage comprehensive chord database with user customizations

**Implementation**:

```typescript
class ChordRegistry {
	private builtInChords: Map<string, ChordVariationSet>;
	private userChords: Map<string, ChordVariationSet>;
	private songSpecificDefaults: Map<string, Map<string, string>>; // songId -> chordName -> formationId

	// Core methods
	async loadBuiltInChords(): Promise<void>;
	async loadUserChords(): Promise<void>;

	getChordVariations(chordName: string): ChordFormation[];
	getDefaultFormation(chordName: string, songId?: string): ChordFormation;

	addCustomFormation(formation: ChordFormation): void;
	setDefaultForSong(songId: string, chordName: string, formationId: string): void;

	searchChords(query: string, filters?: ChordFilter): ChordFormation[];
}
```

#### 1.3 Built-in Chord Database

**Goal**: Comprehensive database of standard chord formations

**Database Structure**:

- 500+ common chord formations
- Multiple variations per chord (open, barre, alternate positions)
- Difficulty ratings and finger assignments
- Popular alternative voicings
- Extended chords (7th, 9th, 11th, 13th, sus, add, etc.)

### 2. Song-Specific Chord Defaults (Weeks 5-6)

#### 2.1 Song Chord Configuration

**Goal**: Allow users to set default chord fingerings for specific songs

**Features**:

- Set default formation for each chord in a song
- Override global defaults on per-song basis
- Visual indication of custom defaults
- Easy switching between formations
- Bulk operations for similar chords

**UI Implementation**:

```svelte
<!-- SongChordDefaults.svelte -->
<script lang="ts">
	import { chordState } from '$lib/state/chord.svelte.ts';

	let { songId, detectedChords } = $props<{
		songId: string;
		detectedChords: string[];
	}>();

	let editingChord = $state<string | null>(null);

	// Use global chord state
	function getDefaultFormation(chordName: string) {
		return chordState.getDefaultFormation(chordName, songId);
	}

	function handleFormationSelect(chordName: string, formationId: string) {
		chordState.setSongDefault(songId, chordName, formationId);
		editingChord = null;
	}
</script>

<div class="chord-defaults-panel">
	<h3>Song Chord Defaults</h3>

	{#each detectedChords as chordName}
		<div class="chord-default-item">
			<span class="chord-name">{chordName}</span>

			<ChordDiagram formation={getDefaultFormation(chordName)} size="small" />

			<button onclick={() => (editingChord = chordName)} class="edit-button"> Change </button>
		</div>
	{/each}
</div>

{#if editingChord}
	<ChordFormationSelector
		chordName={editingChord}
		currentFormation={chordDefaults.get(editingChord)}
		onselect={handleFormationSelect}
		oncancel={() => (editingChord = null)}
	/>
{/if}
```

### 3. Instance-Specific Chord Overrides (Weeks 7-8)

#### 3.1 Contextual Chord Editing

**Goal**: Allow different chord fingerings for specific instances within a song

**Features**:

- Right-click or long-press on chord to edit
- Visual indicators for overridden chords
- Quick access to common alternatives
- Undo/redo for chord changes
- Copy chord formation to other instances

**Data Structure**:

```typescript
interface ChordInstance {
	id: string;
	chordName: string;
	position: TabPosition;
	formationId?: string; // Override default if specified
	customFormation?: ChordFormation; // Completely custom formation
	metadata?: {
		reason?: string; // Why this override was chosen
		difficulty?: number;
		context?: string; // "easier transition", "better sound"
	};
}

interface TabWithChordOverrides extends ParsedTab {
	chordInstances: ChordInstance[];
	songDefaults: Map<string, string>;
}
```

#### 3.2 Smart Chord Suggestions

**Goal**: Suggest appropriate chord formations based on context

**Algorithm Factors**:

- Previous and next chords (transition difficulty)
- Song key and progression
- User skill level preferences
- Frequency of chord in song
- Position on fretboard

### 4. Advanced Chord Editor UI (Weeks 9-10)

#### 4.1 Interactive Chord Diagram Editor

**Goal**: Visual chord formation creation and editing

**Features**:

- Click fretboard to place/remove fingers
- Drag to create barre chords
- Automatic finger assignment suggestions
- Audio preview of chord
- Difficulty calculation
- Conflict detection (impossible fingerings)

**Implementation**:

```svelte
<!-- ChordEditor.svelte -->
<script lang="ts">
	export let formation: ChordFormation;
	export let onchange: (formation: ChordFormation) => void;

	let fretboard = $state<FretboardState>(initializeFretboard());
	let audioContext = $state<AudioContext | null>(null);

	function handleFretClick(string: number, fret: number) {
		// Update formation based on click
		updateFormation(string, fret);
		playChordPreview();
	}

	function calculateDifficulty(): number {
		// Algorithm to calculate chord difficulty
		return analyzeDifficulty(formation);
	}
</script>

<div class="chord-editor">
	<div class="fretboard-container">
		<InteractiveFretboard {formation} onclick={handleFretClick} showFingerNumbers={true} />
	</div>

	<div class="chord-info">
		<div class="difficulty">
			Difficulty: {calculateDifficulty()}/5
		</div>

		<div class="finger-assignments">
			<!-- Finger assignment controls -->
		</div>

		<button onclick={playChordPreview}> Preview Sound </button>
	</div>
</div>
```

### 5. Runes-Based Chord State Management

#### 5.1 Chord State Architecture

**Goal**: Modern state management for chord data using Svelte 5 runes

```typescript
// src/lib/state/chord.svelte.ts
class ChordState {
	// Core chord data
	formations = $state(new Map<string, ChordFormation[]>());
	songDefaults = $state(new Map<string, Map<string, string>>()); // songId -> chordName -> formationId
	instanceOverrides = $state(new Map<string, ChordInstance[]>()); // songId -> instances

	// UI state
	selectedChord = $state<string | null>(null);
	editingFormation = $state<ChordFormation | null>(null);

	// Derived state
	availableChords = $derived(() => Array.from(this.formations.keys()).sort());

	hasCustomDefaults = $derived(
		() => (songId: string) =>
			this.songDefaults.has(songId) && this.songDefaults.get(songId)!.size > 0
	);

	// Actions
	addFormation(chordName: string, formation: ChordFormation) {
		if (!this.formations.has(chordName)) {
			this.formations.set(chordName, []);
		}
		this.formations.get(chordName)!.push(formation);
	}

	getDefaultFormation(chordName: string, songId?: string): ChordFormation | null {
		const variations = this.formations.get(chordName);
		if (!variations || variations.length === 0) return null;

		// Check for song-specific default
		if (songId && this.songDefaults.has(songId)) {
			const songDefaults = this.songDefaults.get(songId)!;
			const formationId = songDefaults.get(chordName);
			if (formationId) {
				return variations.find((v) => v.id === formationId) || variations[0];
			}
		}

		// Return first variation as default
		return variations[0];
	}

	setSongDefault(songId: string, chordName: string, formationId: string) {
		if (!this.songDefaults.has(songId)) {
			this.songDefaults.set(songId, new Map());
		}
		this.songDefaults.get(songId)!.set(chordName, formationId);
	}

	addInstanceOverride(songId: string, instance: ChordInstance) {
		if (!this.instanceOverrides.has(songId)) {
			this.instanceOverrides.set(songId, []);
		}
		this.instanceOverrides.get(songId)!.push(instance);
	}

	getInstanceOverride(
		songId: string,
		position: TabPosition,
		chordName: string
	): ChordFormation | null {
		const instances = this.instanceOverrides.get(songId) || [];
		const override = instances.find(
			(i) => i.chordName === chordName && i.position.position === position.position
		);

		if (override?.customFormation) {
			return override.customFormation;
		}

		if (override?.formationId) {
			const variations = this.formations.get(chordName) || [];
			return variations.find((v) => v.id === override.formationId) || null;
		}

		return null;
	}
}

export const chordState = new ChordState();
```

#### 5.2 Component Integration

```svelte
<!-- ChordEditor.svelte -->
<script lang="ts">
	import { chordState } from '$lib/state/chord.svelte.ts';
	import { tabState } from '$lib/state/tab.svelte.ts';

	let { chordName, songId, position } = $props<{
		chordName: string;
		songId: string;
		position?: TabPosition;
	}>();

	// Get available formations for this chord
	let availableFormations = $derived(() => chordState.formations.get(chordName) || []);

	// Get current formation (with overrides)
	let currentFormation = $derived(() => {
		if (position) {
			// Check for instance override first
			const override = chordState.getInstanceOverride(songId, position, chordName);
			if (override) return override;
		}

		// Fall back to song default or global default
		return chordState.getDefaultFormation(chordName, songId);
	});

	function selectFormation(formation: ChordFormation) {
		if (position) {
			// Set instance override
			chordState.addInstanceOverride(songId, {
				id: crypto.randomUUID(),
				chordName,
				position,
				formationId: formation.id
			});
		} else {
			// Set song default
			chordState.setSongDefault(songId, chordName, formation.id);
		}
	}

	function createCustomFormation() {
		chordState.editingFormation = {
			id: crypto.randomUUID(),
			name: chordName,
			positions: [0, 0, 0, 0, 0, 0],
			difficulty: 1,
			tags: ['custom'],
			metadata: { creator: 'user' }
		};
	}
</script>

<div class="chord-editor">
	<h3>Edit {chordName} Chord</h3>

	<div class="current-formation">
		<h4>Current Formation</h4>
		{#if currentFormation}
			<ChordDiagram formation={currentFormation} />
		{:else}
			<p>No formation selected</p>
		{/if}
	</div>

	<div class="available-formations">
		<h4>Available Formations</h4>
		<div class="formation-grid">
			{#each availableFormations as formation}
				<button
					class="formation-option"
					class:selected={formation.id === currentFormation?.id}
					onclick={() => selectFormation(formation)}
				>
					<ChordDiagram {formation} size="small" />
					<span class="difficulty">Difficulty: {formation.difficulty}/5</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="actions">
		<button onclick={createCustomFormation}> Create Custom Formation </button>
	</div>
</div>
```

### 6. Complex Data Integration (Weeks 11-12)

#### 5.1 Enhanced Tab Data Structure

**Goal**: Store rich chord metadata alongside tab content

**Hybrid Approach**:

1. **Simple Input**: Users can paste standard tabs
2. **Automatic Enhancement**: System detects chords and applies defaults
3. **Progressive Enhancement**: Users can customize as needed
4. **Full Control**: Complete override capability

**Storage Format**:

```typescript
interface EnhancedTab {
	// Basic tab data
	id: string;
	title: string;
	artist: string;
	content: string; // Original tab text

	// Enhanced data
	parsedContent: ParsedTab;
	chordInstances: ChordInstance[];
	songDefaults: Map<string, string>;

	// Metadata
	version: number;
	lastModified: Date;
	customizations: {
		hasCustomDefaults: boolean;
		hasInstanceOverrides: boolean;
		customFormationCount: number;
	};
}
```

#### 5.2 Import/Export System

**Goal**: Seamless data portability and backup

**Features**:

- Export enhanced tabs with all customizations
- Import from various formats (text, JSON, MusicXML)
- Backup/restore chord customizations
- Share chord formations with community

## User Experience Flow

### 1. Basic User Journey

1. **Import/Create Tab**: User pastes or creates tab content
2. **Automatic Detection**: System detects chords and applies defaults
3. **Visual Feedback**: Chord diagrams appear with default formations
4. **Optional Customization**: User can modify defaults if desired

### 2. Advanced User Journey

1. **Song Setup**: User sets preferred defaults for the song
2. **Context-Aware Editing**: System suggests formations based on transitions
3. **Instance Customization**: User overrides specific chord instances
4. **Practice Mode**: Optimized chord formations for learning

### 3. Expert User Journey

1. **Custom Formations**: User creates entirely new chord formations
2. **Community Sharing**: Share formations with other users
3. **Advanced Analysis**: Use difficulty and transition analysis
4. **Bulk Operations**: Apply changes across multiple songs

## Technical Implementation

### Database Schema

```sql
-- Chord formations table
CREATE TABLE chord_formations (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  positions INTEGER[] NOT NULL,
  fingers INTEGER[],
  barre_fret INTEGER,
  barre_start_string INTEGER,
  barre_end_string INTEGER,
  base_fret INTEGER DEFAULT 1,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[],
  is_built_in BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Song chord defaults
CREATE TABLE song_chord_defaults (
  song_id UUID REFERENCES tabs(id),
  chord_name VARCHAR(50),
  formation_id UUID REFERENCES chord_formations(id),
  PRIMARY KEY (song_id, chord_name)
);

-- Chord instance overrides
CREATE TABLE chord_instance_overrides (
  id UUID PRIMARY KEY,
  song_id UUID REFERENCES tabs(id),
  chord_name VARCHAR(50),
  position_index INTEGER,
  formation_id UUID REFERENCES chord_formations(id),
  custom_formation JSONB,
  metadata JSONB
);
```

### Performance Considerations

- Lazy loading of chord diagrams
- Caching of frequently used formations
- Efficient diff algorithms for chord changes
- Optimized rendering for mobile devices

## Success Metrics

### Feature Adoption

- 70% of users customize at least one chord default
- 40% of users create instance-specific overrides
- 20% of users create custom formations
- 90% user satisfaction with chord editing experience

### Technical Performance

- Chord diagram rendering under 100ms
- Database queries under 50ms
- Mobile responsiveness maintained
- Zero data loss in chord customizations

### User Experience

- Intuitive chord editing workflow
- Clear visual feedback for customizations
- Seamless integration with existing features
- Accessible to users with disabilities

This phase establishes TabScroll as a sophisticated chord management system while maintaining the simplicity that makes it accessible to all users.
