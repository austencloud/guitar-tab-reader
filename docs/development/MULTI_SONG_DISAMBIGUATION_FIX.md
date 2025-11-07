# Multi-Song Disambiguation Fix

## Problem Statement

When searching for "Cotton", the system found 50 versions of songs containing "cotton" but automatically selected "Cotton Fields" by CCR without giving the user a choice. The actual song the user wanted was "Cotton" by The Mountain Goats.

The issue: The system was treating all search results as **versions of the same song** rather than detecting **multiple different songs** with similar names.

## Root Cause

The `TabImporter.importFromSearch()` method would immediately call `getRecommendedTab()` on all search results, which assumes they're all versions of the same song. It would then select the "best" version by rating/votes without checking if there were actually multiple distinct songs.

```typescript
// BEFORE: Blindly picks "best" version
const matchingTab = getRecommendedTab(titleData.tabs);
```

## Solution

Added intelligent detection of **unique songs** in search results. When multiple distinct songs are found and no artist was specified, the system now presents a disambiguation view instead of auto-selecting.

### Changes Made

#### 1. Added `getUniqueSongs()` Helper Method

**File:** `src/lib/services/smart-import/implementations/TabImporter.ts`

```typescript
/**
 * Detects unique songs from search results (ignoring version numbers)
 * Returns array of unique {title, artist} combinations
 */
private getUniqueSongs(tabs: TabInfo[]): Array<{ title: string; artist: string }> {
  const seen = new Set<string>();
  const uniqueSongs: Array<{ title: string; artist: string }> = [];
  
  for (const tab of tabs) {
    // Normalize title to detect versions (remove "ver 2", "*", etc.)
    const normalizedTitle = tab.title
      .toLowerCase()
      .replace(/\s*\(ver\s*\d+\)\s*/gi, '')
      .replace(/\s*\*\s*/g, '')
      .trim();
    
    const key = `${normalizedTitle}|${tab.artist.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSongs.push({ title: tab.title, artist: tab.artist });
    }
  }
  
  return uniqueSongs;
}
```

#### 2. Added Multi-Song Detection Logic

**File:** `src/lib/services/smart-import/implementations/TabImporter.ts`

```typescript
const titleData = await this.ugClient.searchSong(intent.song!, intent.artist);

if (titleData.success && titleData.tabs.length > 0) {
  // Check if we have multiple DIFFERENT songs (not just versions)
  const uniqueSongs = this.getUniqueSongs(titleData.tabs);
  
  // If multiple distinct songs and no artist specified, present disambiguation
  if (uniqueSongs.length > 1 && !intent.artist) {
    console.log(`🔀 Found ${uniqueSongs.length} different songs matching "${intent.song}"`);
    
    return {
      success: true,
      type: 'ambiguous',
      query: intent.song!,
      ambiguityReason: `Found ${uniqueSongs.length} different songs matching "${intent.song}"`,
      suggestions: uniqueSongs.map(song => `${song.artist} - ${song.title}`),
      searchResults: titleData.tabs.slice(0, 20),
      _meta: intent._meta
    };
  }
  
  // Otherwise, continue with best match selection...
}
```

#### 3. Enhanced Disambiguation View

**File:** `src/features/tabs/modules/import/components/views/ImportDisambiguationView.svelte`

Added visual search results display that shows:
- Song title (bold)
- Artist name
- Rating and votes (when available)

```svelte
{#if data.searchResults && data.searchResults.length > 0}
  <div class="search-results-section">
    <h4>Select the song you want:</h4>
    {#each data.searchResults.slice(0, 10) as result}
      <button class="search-result-option" onclick={() => onChoice('suggestion', `${result.artist} - ${result.title}`)}>
        <div class="result-content">
          <span class="result-title">{result.title}</span>
          <span class="result-artist">by {result.artist}</span>
        </div>
        {#if result.rating && result.votes}
          <div class="result-rating">
            <span class="rating-stars">⭐ {result.rating}</span>
            <span class="rating-votes">({result.votes} votes)</span>
          </div>
        {/if}
      </button>
    {/each}
  </div>
{:else if data.suggestions && data.suggestions.length > 0}
  <!-- Fallback to text suggestions -->
{/if}
```

#### 4. Updated Type Definitions

**File:** `src/lib/services/smart-import/types.ts`

Added missing fields to `TabImportResult`:
```typescript
export interface TabImportResult {
  // ... existing fields ...
  query?: string;              // ← NEW: Original query for disambiguation
  ambiguityReason?: string;    // ← NEW: Why it's ambiguous
  searchResults?: any[];       // ← NEW: Full search results for display
  _meta?: IntentMetadata;
}
```

## Behavior Changes

### Before Fix

1. User searches "cotton"
2. System finds 50 results (Cotton Fields, Cotton, etc.)
3. ❌ **Automatically picks highest-rated**: "Cotton Fields" by CCR
4. User gets wrong song

### After Fix

1. User searches "cotton"
2. System finds 50 results
3. ✅ **Detects 2+ unique songs**: "Cotton Fields" (CCR), "Cotton" (Mountain Goats), etc.
4. **Shows disambiguation view** with clickable list:
   - Cotton Fields - Creedence Clearwater Revival ⭐ 4.8
   - Cotton - The Mountain Goats ⭐ 4.5
   - Cotton Candy - Beach House ⭐ 4.2
   - etc.
5. User clicks their desired song
6. System imports the correct tab

## Decision Logic

The system now follows this logic:

```
Search results received
  ├─ Count unique songs (normalize titles, group by artist)
  ├─ IF uniqueSongs > 1 AND no artist specified
  │    └─ SHOW DISAMBIGUATION (let user choose)
  └─ ELSE
       └─ SELECT BEST VERSION (by rating/votes)
```

**When disambiguation is shown:**
- Multiple distinct songs found
- No artist was specified in query
- Shows top 10 results with full details

**When auto-selection happens:**
- Only one song found (may have multiple versions)
- Artist was specified (narrows down to one song)
- Continues with existing best-version logic

## Edge Cases Handled

1. **Single song, multiple versions** (e.g., "Wonderwall" - 20 versions by Oasis)
   - ✅ Auto-selects best version
   - No disambiguation needed

2. **Multiple songs, no artist** (e.g., "Cotton" - different artists)
   - ✅ Shows disambiguation
   - User chooses correct song

3. **Multiple songs, artist specified** (e.g., "Cotton by Mountain Goats")
   - ✅ Auto-selects (artist narrows it down)
   - No disambiguation needed

4. **Common song title** (e.g., "Home" - 100+ versions by different artists)
   - ✅ Shows disambiguation
   - Limited to top 10 most relevant results

## UI/UX Improvements

### Visual Search Results
- Clean, scannable list of options
- Shows artist name clearly below song title
- Displays rating/votes to help user identify popular versions
- Hover effects for better interaction feedback

### Better Context
- Reason message: "Found X different songs matching 'query'"
- Up to 10 results shown (prevents overwhelming choice)
- Results sorted by relevance/rating from search API

### Responsive Design
- Works on mobile and desktop
- Dark mode support
- Accessible button interactions

## Performance Considerations

- **No Extra API Calls**: Uses existing search results
- **Efficient Deduplication**: O(n) time complexity for detecting unique songs
- **Limited Results**: Only shows top 10 to keep UI fast

## Testing Scenarios

Test these queries to verify the fix:

1. **"cotton"** → Should show disambiguation with Cotton Fields (CCR) and Cotton (Mountain Goats)
2. **"home"** → Should show disambiguation with multiple artists
3. **"wonderwall"** → Should auto-select Oasis version (only one song, multiple versions)
4. **"cotton by mountain goats"** → Should auto-select (artist specified)
5. **"stairway to heaven"** → Should auto-select Led Zeppelin (iconic song, one artist)

## Files Modified

1. `src/lib/services/smart-import/implementations/TabImporter.ts`
   - Added `getUniqueSongs()` helper method
   - Added multi-song detection logic
   - Returns disambiguation result when needed

2. `src/lib/services/smart-import/types.ts`
   - Added `query`, `ambiguityReason`, `searchResults` fields to `TabImportResult`

3. `src/features/tabs/modules/import/components/views/ImportDisambiguationView.svelte`
   - Added search results section with visual cards
   - Shows rating/votes information
   - Added dark mode styles for new section

## Future Enhancements

1. **Exact Match Detection**: Prioritize exact title matches over partial matches
2. **Popularity Weighting**: Use streaming data (Spotify/Last.fm) to rank results
3. **User History**: Remember previous choices to improve future suggestions
4. **Smart Grouping**: Group by album or artist when appropriate
5. **Preview Snippets**: Show first few bars of tab content to help identification
