# Live Search Enhancement Plan

## Problem
When users search for obscure songs like "Rule 1 Magic" by Fish in a Birdcage, the AI doesn't know the song exists (not in training data) and makes poor guesses. **75% success rate isn't good enough.**

## User's Vision
The system should be **proactive and conversational**:
1. When uncertain, **actively search Ultimate Guitar** to discover which artists have that song
2. **Ask the user** when multiple options are found
3. **Learn from search results** rather than relying on AI training data

## Current Flow (Broken)
```
User: "Rule 1 Magic"
  ↓
AI analyzes (but doesn't know this song)
  ↓
AI marks as AMBIGUOUS with poor guesses
  ↓
Shows generic suggestions like "Search for: Rule 1 Magic"
  ❌ User gets no real options
```

## New Flow (Fixed)
```
User: "Rule 1 Magic"
  ↓
AI detects uncertainty/ambiguity
  ↓
🔍 ACTIVELY SEARCH ULTIMATE GUITAR (using existing scrape-title endpoint)
  ↓
Find: "Rule 1 Magic" by Fish in a Birdcage (+ other artists if any)
  ↓
Show user REAL search results:
  • Fish in a Birdcage - Rule 1 Magic ⭐⭐⭐⭐⭐ (1,234 votes)
  • [Other artists if found]
  ↓
User picks the correct one
  ✅ Success!
```

## Implementation

### 1. Backend: Smart Import Enhancement

**File**: `src/routes/api/smart-import/+server.ts`

**Change the AMBIGUOUS handler** (around line 30-43):

```typescript
// OLD CODE (lines 30-43):
if (intent.type === 'AMBIGUOUS') {
	console.log(`❓ Ambiguous query detected: ${intent.ambiguityReason}`);
	return json({
		success: true,
		type: 'ambiguous',
		query: query,
		ambiguityReason: intent.ambiguityReason,
		suggestions: intent.suggestions || [],
		possibleArtist: intent.artist,
		possibleSong: intent.song,
		_meta: intent._meta
	});
}

// NEW CODE (with live search):
if (intent.type === 'AMBIGUOUS') {
	console.log(`❓ Ambiguous query detected: ${intent.ambiguityReason}`);
	console.log(`🔍 Performing live search on Ultimate Guitar for: "${query}"`);

	try {
		// ACTUALLY SEARCH UG to get real results
		const searchResponse = await fetch('/api/scrape-title', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				song: intent.song || query,
				artist: intent.artist
			})
		});

		const searchData = await searchResponse.json();

		if (searchData.success && searchData.tabs?.length > 0) {
			console.log(`✅ Live search found ${searchData.tabs.length} real tabs`);

			// Group by artist to show real options
			const artistGroups = new Map();
			searchData.tabs.forEach((tab) => {
				const artist = tab.artist || 'Unknown Artist';
				if (!artistGroups.has(artist)) {
					artistGroups.set(artist, []);
				}
				artistGroups.get(artist).push(tab);
			});

			// Create suggestions from REAL search results
			const realSuggestions = Array.from(artistGroups.entries())
				.slice(0, 5)
				.map(([artist, tabs]) => `${artist} - ${intent.song || query}`);

			return json({
				success: true,
				type: 'ambiguous_with_results', // New type!
				query: query,
				ambiguityReason: `Found ${searchData.tabs.length} versions by different artists`,
				suggestions: realSuggestions,
				searchResults: searchData.tabs.slice(0, 10), // Top 10 results
				possibleArtist: intent.artist,
				possibleSong: intent.song || query,
				_meta: intent._meta
			});
		} else {
			// No results found - fall back to AI suggestions
			console.warn(`⚠️ Live search found nothing`);
			return json({
				success: true,
				type: 'ambiguous',
				query: query,
				ambiguityReason: intent.ambiguityReason,
				suggestions: intent.suggestions || [],
				possibleArtist: intent.artist,
				possibleSong: intent.song,
				_meta: intent._meta
			});
		}
	} catch (searchError) {
		console.error(`❌ Live search failed:`, searchError);
		// Fall back to AI suggestions if search fails
		return json({
			success: true,
			type: 'ambiguous',
			query: query,
			ambiguityReason: intent.ambiguityReason,
			suggestions: intent.suggestions || [],
			possibleArtist: intent.artist,
			possibleSong: intent.song,
			_meta: intent._meta
		});
	}
}
```

### 2. Frontend: UI Enhancement

**File**: `src/features/tabs/components/WebImportModal.svelte`

**Handle the new `ambiguous_with_results` type**:

In the `handleSmartImport` function (around line 108):

```typescript
if (data.success) {
	if (data.type === 'ambiguous' || data.type === 'ambiguous_with_results') {
		disambiguationData = {
			query: data.query,
			reason: data.ambiguityReason,
			suggestions: data.suggestions || [],
			possibleArtist: data.possibleArtist,
			possibleSong: data.possibleSong,
			// NEW: Include search results
			searchResults: data.searchResults || []
		};
		currentView = 'disambiguation';
	}
	// ... rest of the code
}
```

**Update the disambiguation view** to show actual search results:

```svelte
{:else if currentView === 'disambiguation'}
	<div class="disambiguation-view">
		{#if disambiguationData}
			<div class="disambiguation-header">
				<p class="query-display">"{disambiguationData.query}"</p>
				<p class="reason-text">{disambiguationData.reason}</p>
			</div>

			<div class="options-container">
				<h3>What did you mean?</h3>

				<!-- NEW: Show actual search results if available -->
				{#if disambiguationData.searchResults && disambiguationData.searchResults.length > 0}
					<div class="search-results-section">
						<h4>Found these tabs:</h4>
						{#each disambiguationData.searchResults as result}
							<button
								class="search-result-option"
								onclick={() => handleSearchResultSelect(result)}
							>
								<div class="result-info">
									<span class="result-artist">{result.artist}</span>
									<span class="result-title">{result.title}</span>
									<span class="result-type">{result.type}</span>
									{#if result.rating}
										<span class="result-rating">
											{'⭐'.repeat(result.rating)} ({result.votes} votes)
										</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<!-- Fall back to AI suggestions if no search results -->
					{#if disambiguationData.suggestions && disambiguationData.suggestions.length > 0}
						<div class="suggestions-section">
							<h4>Did you mean:</h4>
							{#each disambiguationData.suggestions as suggestion}
								<button
									class="suggestion-option"
									onclick={() => handleDisambiguationChoice('suggestion', suggestion)}
								>
									<span class="option-icon">💡</span>
									<span class="option-text">{suggestion}</span>
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
{/if}
```

**Add handler for search result selection**:

```typescript
async function handleSearchResultSelect(result: any) {
	isLoading = true;
	errorMessage = '';

	try {
		const response = await fetch('/api/parse-ug-url', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: result.url })
		});

		const data = await response.json();

		if (data.success) {
			tabTitle = data.title || result.title;
			tabArtist = data.artist || result.artist;
			pastedContent = data.content || '';
			currentView = 'preview';
		} else {
			errorMessage = data.error || 'Failed to fetch tab';
		}
	} catch (error) {
		errorMessage = 'Network error. Please check your connection and try again.';
	} finally {
		isLoading = false;
	}
}
```

## Benefits

### Before (75% success rate)
- "Rule 1 Magic" → AI guesses → User gets confused → Fails
- Relies only on AI training data (limited knowledge)
- No verification against actual Ultimate Guitar content

### After (Near 100% success rate)
- "Rule 1 Magic" → **Live UG search** → Shows "Fish in a Birdcage" → User clicks → Success!
- Learns from **actual UG data** in real-time
- Shows **real tabs with ratings and votes**
- Conversational: "I found these options, which one?"

## Test Cases

After implementation, test with:

1. **"Rule 1 Magic"** - Should find Fish in a Birdcage
2. **"Stay"** - Should show Rihanna, Kid LAROI, Shakespears Sister, Lisa Loeb
3. **"Candy Shop"** - Should show 50 Cent AND Andrew Bird
4. **"Love Song"** - Should show Tesla, Sara Bareilles, The Cure, etc.
5. **"Some Made Up Song 12345"** - Should fall back to AI suggestions gracefully

## Next Steps

1. ✅ Document the approach (this file)
2. ⏳ Implement backend changes (smart-import/+server.ts)
3. ⏳ Implement frontend changes (WebImportModal.svelte)
4. ⏳ Test with all edge cases
5. ⏳ Deploy and verify 95%+ success rate

---

**This enhancement transforms the system from "guessing" to "discovering"** - making it truly intelligent and user-friendly!
