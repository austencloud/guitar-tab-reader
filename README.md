# Guitar Tab Reader Refactoring Plan

After analyzing the codebase, I've identified several areas that need improvement to enhance maintainability, modularity, and clarity. This refactoring plan builds on your initial proposal and includes additional recommendations.

## 1. Tab Parser Module Refactoring

The `tabParser.ts` file is the "stinkiest" part of the codebase with several issues:

### Current Issues:
- Monolithic structure with too many responsibilities in a single file
- Complex nested logic and imperative code style
- Poor separation of concerns between parsing steps
- Extensive code duplication in technique detection (hammer-ons, pull-offs, bends, etc.)
- Limited error handling and validation
- Lack of testability and extensibility
- No support for different tab formats

### Proposed Solution:

#### 1.1. Create a Parser Pipeline Architecture

Building on your initial proposal, implement a robust parser pipeline that separates the parsing process into distinct, manageable steps:

```typescript
// src/lib/utils/parsing/types.ts
export interface ParseOptions {
  detectStringCount?: boolean;
  detectTuning?: boolean;
  preserveSpacing?: boolean;
  // other configuration options
}

export interface ParserContext {
  lines: string[];
  options: ParseOptions;
  result: Partial<ParsedTab>;
  // Intermediate state for passing between steps
  currentSection?: Partial<TabSection>;
  stringLines?: string[];
  nonTabLines?: string[];
}

export interface ParserStep {
  name: string;
  process(context: ParserContext): void;
}

// Main parser class that orchestrates the process
export class TabParser {
  private steps: ParserStep[] = [];

  constructor(private options: ParseOptions = {}) {
    // Register default steps
    this.steps = [
      new PreprocessStep(),
      new SectionDetectionStep(),
      new TuningDetectionStep(),
      new StringCountDetectionStep(),
      new TabLineIdentificationStep(),
      new NoteParsingStep(),
      new ChordDetectionStep(),
      // more steps as needed
    ];
  }

  addStep(step: ParserStep): void {
    this.steps.push(step);
  }

  removeStep(stepName: string): void {
    this.steps = this.steps.filter(step => step.name !== stepName);
  }

  parse(tabText: string): ParsedTab {
    const context: ParserContext = {
      lines: tabText.split('\n'),
      options: this.options,
      result: {
        sections: [],
        stringCount: 6, // default
        stringNames: ['e', 'B', 'G', 'D', 'A', 'E'] // default
      }
    };

    // Run each step
    for (const step of this.steps) {
      try {
        step.process(context);
      } catch (error) {
        console.error(`Error in parser step '${step.name}':`, error);
        // Add better error handling with recovery strategies
      }
    }

    return context.result as ParsedTab;
  }
}
```

#### 1.2. Implement Individual Parser Steps

Each step should be in its own file with clear responsibility:

```typescript
// src/lib/utils/parsing/steps/TabLineIdentificationStep.ts
import { ParserStep, ParserContext } from '../types';

export class TabLineIdentificationStep implements ParserStep {
  name = 'TabLineIdentification';

  process(context: ParserContext): void {
    const { lines, result } = context;
    const tabLines: string[] = [];
    const nonTabLines: string[] = [];
    
    // Identify tab lines based on patterns
    lines.forEach(line => {
      if (this.isTabLine(line)) {
        tabLines.push(line);
      } else if (line.trim()) {
        nonTabLines.push(line);
      }
    });
    
    // Store in context for next steps
    context.stringLines = tabLines;
    context.nonTabLines = nonTabLines;
  }
  
  private isTabLine(line: string): boolean {
    return Boolean(
      line.includes('--') ||
      line.includes('|') ||
      line.match(/^[eEADGBbf]:?\|?-+/) ||
      line.match(/^[eEADGBbf]\|/) ||
      line.match(/^\|?-+\|?$/) ||
      (line.includes('-') && !line.match(/^[A-Za-z\s]+:/))
    );
  }
}
```

#### 1.3. Create a Technique Parser System

Replace the duplicated technique parsing logic with a cleaner, more extensible approach:

```typescript
// src/lib/utils/parsing/techniques/TechniqueParser.ts
export interface TechniqueParser {
  type: string;
  canParse(char: string, line: string, pos: number): boolean;
  parse(line: string, pos: number): { 
    technique: string; 
    endPos: number; 
    targetFret?: number;
    metadata?: Record<string, any>;
  };
}

// src/lib/utils/parsing/techniques/registry.ts
import { HammerOnParser } from './HammerOnParser';
import { PullOffParser } from './PullOffParser';
import { BendParser } from './BendParser';
import { SlideParser } from './SlideParser';
import { VibratoParser } from './VibratoParser';
import { TechniqueParser } from './TechniqueParser';

export class TechniqueRegistry {
  private techniques: TechniqueParser[] = [];
  
  constructor() {
    // Register default technique parsers
    this.register(new HammerOnParser());
    this.register(new PullOffParser());
    this.register(new BendParser());
    this.register(new SlideParser());
    this.register(new VibratoParser());
  }
  
  register(parser: TechniqueParser): void {
    this.techniques.push(parser);
  }
  
  findParser(char: string, line: string, pos: number): TechniqueParser | null {
    return this.techniques.find(parser => parser.canParse(char, line, pos)) || null;
  }
}
```

## 2. Improved Note Handling and Data Structure

### Current Issues:
- Poor representation of guitar techniques
- Limited metadata for notes
- No concept of duration or rhythm
- Lack of consistent positioning for notes

### Proposed Solution:

#### 2.1. Enhanced Note Model

```typescript
// src/lib/utils/models/Note.ts
export enum NoteType {
  REGULAR = 'regular',
  GHOST = 'ghost',
  DEAD = 'dead',
  NATURAL_HARMONIC = 'naturalHarmonic',
  ARTIFICIAL_HARMONIC = 'artificialHarmonic'
}

export enum TechniqueType {
  HAMMER_ON = 'hammerOn',
  PULL_OFF = 'pullOff',
  BEND = 'bend',
  RELEASE = 'release',
  SLIDE_UP = 'slideUp',
  SLIDE_DOWN = 'slideDown',
  VIBRATO = 'vibrato',
  TRILL = 'trill',
  TAP = 'tap',
  // etc.
}

export interface Technique {
  type: TechniqueType;
  targetFret?: number;
  intensity?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface TabNote {
  fret: number;
  string: number;
  position: number;
  type: NoteType;
  techniques: Technique[];
  duration?: number;
  velocity?: number;
  isOnBeat?: boolean;
}
```

#### 2.2. Better Position Tracking

```typescript
// src/lib/utils/models/TabPosition.ts
export interface TabPosition {
  position: number;
  relativeTime?: number;
  isMeasureLine: boolean;
  notes: Map<number, TabNote>; // string index to note
  displayColumns?: number; // for visual rendering
}
```

## 3. Chord Utils Refactoring

### Current Issues:
- Large hardcoded chord dictionary
- Limited chord voicing options
- Inefficient text-based chord detection
- Mixing chord definition and UI concerns

### Proposed Solution:

#### 3.1. Chord Registry Pattern

```typescript
// src/lib/utils/chords/ChordRegistry.ts
export interface ChordDefinition {
  positions: number[];
  barre?: number;
  baseFret?: number;
  fingers?: number[];
}

export type ChordVariation = {
  positions: number[];
  barre?: number;
  baseFret?: number;
  difficulty?: number;
};

export class ChordRegistry {
  private chords: Map<string, ChordVariation[]> = new Map();
  
  // Load from embedded definitions and/or external source
  async initialize(): Promise<void> {
    // Load basic chord definitions
    this.registerBasicChords();
    
    // Try to load extended definitions
    try {
      await this.loadExtendedChords();
    } catch (error) {
      console.warn('Failed to load extended chord definitions:', error);
    }
  }
  
  registerChord(name: string, variations: ChordVariation[]): void {
    this.chords.set(name, variations);
  }
  
  getChord(name: string): ChordVariation[] | undefined {
    return this.chords.get(name);
  }
  
  // Additional utility methods
  findAlternativeVoicings(name: string): ChordVariation[] {
    // Return alternative ways to play this chord
  }
  
  private registerBasicChords(): void {
    // Register essential chords
  }
  
  private async loadExtendedChords(): Promise<void> {
    // Load extended chord dictionary
  }
}
```

#### 3.2. Chord Detection Service

```typescript
// src/lib/utils/chords/ChordDetectionService.ts
export interface ChordMatch {
  name: string;
  startIndex: number;
  endIndex: number;
  variation: ChordVariation;
}

export class ChordDetectionService {
  private chordRegistry: ChordRegistry;
  
  constructor(chordRegistry: ChordRegistry) {
    this.chordRegistry = chordRegistry;
  }
  
  detectChordsInText(text: string): ChordMatch[] {
    // Use more efficient regex approach with word boundaries
    // Return found chords with positions
  }
  
  detectChordsInTab(tabLines: string[]): ChordMatch[] {
    // Analyze tab content for chord patterns
    // Return found chords with positions
  }
}
```

## 4. Component Architecture Improvements

### Current Issues:
- Excessive component coupling
- Large, complex components with multiple responsibilities
- Complex prop interface
- State management inconsistencies between components
- Inconsistent event handling

### Proposed Solution:

#### 4.1. Component Hierarchy Refactoring

```
src/lib/components/
├── core/
│   ├── TabViewer.svelte (basic viewer only)
│   ├── TabEditor.svelte
│   └── TabVisualizer.svelte
├── features/
│   ├── ChordDisplay/
│   │   ├── ChordDiagram.svelte
│   │   ├── ChordTooltip.svelte
│   │   └── ChordModal.svelte
│   ├── AutoScroll/
│   │   ├── ScrollControls.svelte
│   │   └── ScrollService.ts
│   └── Settings/
│       ├── SettingsPanel.svelte
│       └── SettingsButton.svelte
└── EnhancedTabViewer.svelte (composed of smaller components)
```

#### 4.2. State Management With Stores

Replace prop drilling with Svelte stores:

```typescript
// src/lib/stores/tabStore.ts
import { writable, derived } from 'svelte/store';
import { parseTab, type ParsedTab } from '../utils/parsing/tabParser';

export const tabContent = writable('');
export const parsedTab = derived(tabContent, $content => parseTab($content));
export const currentSection = writable(0);
export const fontSize = writable(14);

// Actions and derived data
export const sections = derived(parsedTab, $tab => $tab?.sections || []);
export const stringCount = derived(parsedTab, $tab => $tab?.stringCount || 6);

export function updateTabContent(content: string) {
  tabContent.set(content);
}
```

## 5. Performance Optimizations

### Current Issues:
- Inefficient DOM manipulation with class cloning
- Excessive re-renders
- Poor handling of large tab files
- Heavy tooltip calculations on each interaction
- Performance issues with auto-scrolling

### Proposed Solution:

#### 5.1. Virtualized Rendering

For large tabs, implement virtualized rendering to only render visible parts:

```typescript
// src/lib/components/core/VirtualizedTabViewer.svelte
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { ParsedTab } from '../../utils/models';
  
  export let parsedTab: ParsedTab;
  export let viewportHeight: number = 400;
  export let rowHeight: number = 20;
  
  let container: HTMLElement;
  let visibleLines: { index: number; content: string }[] = [];
  let scrollTop = 0;
  let totalHeight = 0;
  
  $: totalHeight = parsedTab.sections.reduce((total, section) => {
    return total + section.lines.length * rowHeight;
  }, 0);
  
  $: {
    updateVisibleLines(scrollTop);
  }
  
  function updateVisibleLines(scrollPosition: number) {
    // Calculate which lines should be visible
    const startIndex = Math.floor(scrollPosition / rowHeight);
    const endIndex = Math.ceil((scrollPosition + viewportHeight) / rowHeight);
    
    // Extra buffer for smooth scrolling
    const buffer = 5;
    
    // Find actual lines to render
    visibleLines = findLinesInRange(Math.max(0, startIndex - buffer), endIndex + buffer);
  }
  
  function findLinesInRange(start: number, end: number) {
    // Map from flat index to actual section/line
    // ...implementation
  }
  
  function handleScroll(event: Event) {
    scrollTop = (event.target as HTMLElement).scrollTop;
  }
</script>

<div 
  class="virtualized-container" 
  bind:this={container}
  on:scroll={handleScroll}
  style="height: {viewportHeight}px;">
  
  <div class="spacer" style="height: {totalHeight}px;">
    <div class="visible-content" style="transform: translateY({Math.floor(scrollTop / rowHeight) * rowHeight}px)">
      {#each visibleLines as line}
        <div class="tab-line" style="height: {rowHeight}px">
          {@html line.content}
        </div>
      {/each}
    </div>
  </div>
</div>
```

#### 5.2. Optimize Chord Detection

Use a more efficient approach for chord detection:

```typescript
// src/lib/utils/chords/ChordDetectionOptimized.ts
export function findChordsInText(text: string, chordDictionary: ChordDictionary): ProcessedChord[] {
  if (!text) return [];
  
  // Precompile the regular expression
  const chordPattern = /\b([A-G][b#]?(?:m|maj|min|aug|dim|sus[24]|add\d|m?7|m?9|m?11|m?13|6|5)*)(?=\s|$|\]|\)|\|)/g;
  
  // Use Set for faster lookups
  const chordSet = new Set(Object.keys(chordDictionary));
  
  const result: ProcessedChord[] = [];
  let match;
  
  while ((match = chordPattern.exec(text)) !== null) {
    const chordName = match[1];
    
    if (chordSet.has(chordName)) {
      result.push({
        name: chordName,
        // Other chord properties
        startIndex: match.index,
        endIndex: match.index + chordName.length
      });
    }
  }
  
  return result;
}
```

## 6. Testing Strategy

### Current Issues:
- Lack of unit tests
- No test coverage for critical parsing logic
- Manual testing burden

### Proposed Solution:

#### 6.1. Robust Test Suite

```typescript
// src/lib/utils/parsing/__tests__/tabParser.test.ts
import { TabParser } from '../TabParser';
import { SectionDetectionStep } from '../steps/SectionDetectionStep';
import { TechniqueRegistry } from '../techniques/registry';

describe('TabParser', () => {
  let parser: TabParser;
  
  beforeEach(() => {
    parser = new TabParser();
  });
  
  test('should parse basic tab with correct string count', () => {
    const tabText = `
    e|---0----|
    B|---3----|
    G|---2----|
    D|---0----|
    A|--------|
    E|---0----|
    `;
    
    const result = parser.parse(tabText);
    
    expect(result.stringCount).toBe(6);
    expect(result.sections.length).toBe(1);
  });
  
  test('should detect sections correctly', () => {
    const tabText = `
    [Verse]
    e|---0----|
    B|---3----|
    
    [Chorus]
    e|---2----|
    B|---3----|
    `;
    
    const result = parser.parse(tabText);
    
    expect(result.sections.length).toBe(2);
    expect(result.sections[0].title).toBe('Verse');
    expect(result.sections[1].title).toBe('Chorus');
  });
  
  test('should handle hammer-on techniques', () => {
    const tabText = `e|--0h2--|`;
    
    const result = parser.parse(tabText);
    
    const note = result.sections[0].positions[0].notes.get(0);
    expect(note?.fret).toBe(0);
    expect(note?.technique).toBe('hammerOn');
    expect(note?.techniqueFret).toBe(2);
  });
});
```

## 7. Documentation

### Current Issues:
- Limited code documentation
- No developer documentation on architecture
- Missing usage examples

### Proposed Solution:

#### 7.1. Comprehensive Documentation

```typescript
/**
 * Tab Parser System
 * 
 * This module provides a pipeline-based approach to parsing guitar tab notation.
 * Each step in the pipeline is responsible for a specific aspect of the parsing
 * process, making the system extensible and maintainable.
 * 
 * Basic Usage:
 * ```
 * const parser = new TabParser();
 * const parsedTab = parser.parse(tabText);
 * ```
 * 
 * Advanced Usage:
 * ```
 * const parser = new TabParser({
 *   detectStringCount: true,
 *   detectTuning: true
 * });
 * 
 * // Add custom parsing step
 * parser.addStep(new CustomParsingStep());
 * 
 * const parsedTab = parser.parse(tabText);
 * ```
 * 
 * @module parsing
 */

// Each class and interface should have proper JSDoc
```

## 8. Build a Style Guide and Component Library

Create a standardized component library that follows best practices for accessibility and performance:

```typescript
// src/lib/components/ui/Button.svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'text' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    text: 'bg-transparent text-blue-600 hover:bg-gray-100'
  };
  
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };
</script>

<button
  {type}
  {disabled}
  class="rounded font-medium transition-colors {variantClasses[variant]} {sizeClasses[size]} {$$restProps.class || ''}"
  on:click
  on:mouseenter
  on:mouseleave
  {...$$restProps}
>
  <slot />
</button>
```

## Implementation Strategy

1. **Phase 1**: Create the core parsing pipeline and rewrite the tab parser
   - Implement types and interfaces
   - Create parser pipeline architecture
   - Refactor technique parsing

2. **Phase 2**: Improve UI components and state management
   - Implement Svelte stores for state
   - Break down the large EnhancedTabViewer component
   - Create reusable UI components

3. **Phase 3**: Performance optimizations and testing
   - Implement virtualized rendering
   - Optimize chord detection
   - Add comprehensive test suite

4. **Phase 4**: Documentation and refinement
   - Add JSDoc to all modules
   - Create developer documentation
   - Performance profiling and optimization