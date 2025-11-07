# AI Import Ambiguity Fix - "Crazy" Problem Resolution

## Problem Statement

The AI import feature was failing to properly handle ambiguous single-word queries like "Crazy". When a user searched for "Crazy", the system would:

1. Default to treating it as a song title (SINGLE_TAB_IMPORT)
2. Return results for the artist "Crazy" instead of the song "Crazy" by Gnarls Barkley
3. Even when the user searched "Crazy Gnarls Barkley", it still couldn't find the correct result

This occurred because:
- The AI prompt instructed Claude to default single-word queries to SINGLE_TAB_IMPORT
- Ultimate Guitar's search prioritizes exact artist name matches over song titles
- The MusicBrainz ambiguity detection was being overridden by the AI's default behavior

## Solution Implemented

### 1. **Triple Search Mode UI** (Primary Solution)

Created a new tabbed interface with three explicit search modes:

#### **🎸 Artist Mode**
- Single input field for artist name
- Directly fetches all tabs by that artist
- No ambiguity - user explicitly states they want an artist
- Example: "The Beatles" → Gets all Beatles tabs

#### **🎵 Song Mode**  
- Two input fields: Song Title + Artist (optional but recommended)
- Searches specifically for a song
- If artist is provided: Fetches that artist's tabs and filters for the song
- If no artist: Shows all versions by different artists
- Example: "Crazy" + "Gnarls Barkley" → Finds the exact song

#### **🤖 Smart Mode** (Existing AI-powered search)
- Single natural language input
- Uses Claude AI with MusicBrainz data
- For users who prefer typing "Wonderwall by Oasis"
- Still benefits from the improved ambiguity detection

### 2. **Enhanced Smart Import Service**

Updated `SmartImportService.searchSong()` to:
- Handle artist-specific searches properly
- Return multiple results when ambiguous (instead of failing)
- Provide actionable suggestions
- Show bulk results when multiple versions exist

### 3. **Improved WebImportModal Logic**

The modal now:
- Routes searches differently based on mode
- Artist mode → Direct artist bulk import (no AI needed)
- Song mode → Direct song search with optional artist filter
- Smart mode → Full AI analysis with MusicBrainz

### 4. **Comprehensive Test Suite**

Created `tests/ai-import-ambiguity.spec.js` with tests for:
- "Crazy" ambiguity detection
- "Home" ambiguity (highly common song/artist)
- "Crazy Gnarls Barkley" specific search
- Clear artist queries ("The Beatles")
- Clear song queries ("Wonderwall by Oasis")
- MusicBrainz integration verification
- Console logging for debugging

## Benefits

### User Experience
✅ **No More Guessing**: Users explicitly state what they're searching for  
✅ **Faster for Power Users**: Direct search without AI overhead  
✅ **Better Results**: Song mode with artist ensures correct matches  
✅ **Still Flexible**: Smart mode available for natural language queries  

### Technical
✅ **Reduced AI Costs**: Artist/Song modes don't use Claude API  
✅ **Clearer Intent**: No ambiguity interpretation needed  
✅ **Better Error Messages**: Can provide specific suggestions based on mode  
✅ **Testable**: Each mode can be tested independently  

## Files Changed

### New Files
- `src/features/tabs/modules/import/components/views/ImportDualSearchView.svelte`
- `tests/ai-import-ambiguity.spec.js`
- `docs/development/AI_IMPORT_AMBIGUITY_FIX.md`

### Modified Files
- `src/features/tabs/modules/import/state/import-state.svelte.ts`
  - Added `searchMode`, `artistQuery`, `songQuery`, `songArtistQuery`
  
- `src/features/tabs/modules/import/components/WebImportModal.svelte`
  - Replaced `ImportSmartView` with `ImportDualSearchView`
  - Added mode-specific search logic in `handleSmartImport()`
  
- `src/features/tabs/modules/import/services/implementations/SmartImportService.ts`
  - Enhanced `searchSong()` to return multiple results when ambiguous
  - Added support for artist-filtered song searches

## Testing Instructions

### Manual Testing

1. **Test Artist Mode**:
   - Select "🎸 Artist" tab
   - Search for "Crazy" 
   - Should return tabs by the artist named "Crazy"

2. **Test Song Mode Without Artist**:
   - Select "🎵 Song" tab
   - Enter "Crazy" in song field
   - Leave artist field empty
   - Should show multiple versions by different artists

3. **Test Song Mode With Artist**:
   - Select "🎵 Song" tab
   - Enter "Crazy" in song field
   - Enter "Gnarls Barkley" in artist field
   - Should find the specific song

4. **Test Smart Mode**:
   - Select "🤖 Smart" tab
   - Try: "Crazy by Gnarls Barkley"
   - Should use AI to parse and find the correct song

### Automated Testing

```bash
# Run the ambiguity test suite
npx playwright test tests/ai-import-ambiguity.spec.js

# Run with UI for debugging
npx playwright test tests/ai-import-ambiguity.spec.js --ui

# Run specific test
npx playwright test tests/ai-import-ambiguity.spec.js -g "Crazy"
```

### Expected Results

✅ "Crazy" in Artist mode → Tabs by artist "Crazy"  
✅ "Crazy" in Song mode (no artist) → Multiple versions, user selects  
✅ "Crazy" + "Gnarls Barkley" in Song mode → Exact match  
✅ "Crazy Gnarls Barkley" in Smart mode → AI finds correct song  
✅ "The Beatles" in any mode → Correct results  
✅ "Wonderwall by Oasis" in Smart mode → Single tab result  

## Future Enhancements

### Potential Improvements

1. **Search History**: Remember recent searches per mode
2. **Quick Switch**: "Not finding it? Try as [Artist/Song] instead"
3. **Auto-Suggestions**: Dropdown suggestions while typing
4. **Favorites**: Star frequently searched artists/songs
5. **Genre Filters**: Add genre selector for better targeting
6. **Advanced Filters**: Rating, difficulty, tab type (chords/tabs)

### Analytics Tracking

Consider tracking:
- Which mode users prefer (Artist/Song/Smart)
- Success rate per mode
- Common ambiguous queries
- Time to result per mode

## Migration Notes

### Backward Compatibility

✅ Existing smart queries still work through Smart mode  
✅ URL imports unchanged  
✅ Paste imports unchanged  
✅ All previous features preserved  

### Default Mode

The UI defaults to **Smart mode** for backward compatibility, but users can switch to Artist or Song mode at any time.

### API Changes

No breaking API changes. The `SmartImportService` methods now return additional fields (`tabs`, `suggestions`) but remain backward compatible.

## Conclusion

This fix transforms the AI import from a "guess what the user wants" system into a "user explicitly states intent" system, while still offering AI-powered parsing for users who prefer natural language. The "Crazy" problem is completely solved in Song mode with the artist specified, and partially addressed in Smart mode through better suggestions.

The three-mode approach provides:
- **Clarity** for users who know exactly what they want
- **Flexibility** for users who prefer natural language  
- **Reliability** through explicit intent declaration
- **Cost Efficiency** by reducing unnecessary AI calls

---

**Status**: ✅ Implementation Complete  
**Testing**: ⚠️ Needs Manual Testing  
**Deployment**: ⏳ Pending QA Approval  
