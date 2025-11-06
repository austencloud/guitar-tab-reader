#!/bin/bash
# Script to add live search to smart-import endpoint

FILE="src/routes/api/smart-import/+server.ts"

# Create the new AMBIGUOUS handler with live search
cat > /tmp/new_ambiguous.txt << 'EOF'
	// Handle ambiguous queries - ACTUALLY SEARCH UG to get real results
	if (intent.type === 'AMBIGUOUS') {
		console.log(`❓ Ambiguous query detected: ${intent.ambiguityReason}`);
		console.log(`🔍 Performing live search on Ultimate Guitar for: "${query}"`);

		try {
			// Search UG to get actual results instead of relying on AI guesses
			const searchResponse = await fetch('/api/scrape-title', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ song: intent.song || query, artist: intent.artist })
			});

			const searchData = await searchResponse.json();

			if (searchData.success && searchData.tabs && searchData.tabs.length > 0) {
				console.log(`✅ Live search found ${searchData.tabs.length} real tabs`);

				// Group tabs by artist to show user real options
				const artistGroups = new Map<string, typeof searchData.tabs>();
				searchData.tabs.forEach((tab: any) => {
					const artist = tab.artist || 'Unknown Artist';
					if (!artistGroups.has(artist)) {
						artistGroups.set(artist, []);
					}
					artistGroups.get(artist)!.push(tab);
				});

				// Create suggestions based on ACTUAL search results, not AI guesses
				const realSuggestions = Array.from(artistGroups.entries())
					.slice(0, 5) // Top 5 artists
					.map(([artist, tabs]) => `${artist} - ${intent.song || query}`);

				console.log(`💡 Showing ${realSuggestions.length} real artist options from search`);

				return json({
					success: true,
					type: 'ambiguous_with_results',
					query: query,
					ambiguityReason: `Found ${searchData.tabs.length} versions by different artists`,
					suggestions: realSuggestions,
					// Include actual search results so UI can show them
					searchResults: searchData.tabs.slice(0, 10), // Top 10 results
					possibleArtist: intent.artist,
					possibleSong: intent.song || query,
					_meta: intent._meta
				});
			} else {
				console.warn(`⚠️ Live search found no results, falling back to AI suggestions`);
				// Fall back to AI suggestions if search finds nothing
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
EOF

# Find the line numbers for the AMBIGUOUS block
START_LINE=$(grep -n "// Handle ambiguous queries" "$FILE" | cut -d: -f1)
END_LINE=$(grep -n "^	}$" "$FILE" | awk -v start="$START_LINE" '$1 > start {print $1; exit}' | cut -d: -f1)

echo "Replacing lines $START_LINE to $END_LINE in $FILE"

# Create new file with replacement
head -n $((START_LINE - 1)) "$FILE" > /tmp/smart-import-new.ts
cat /tmp/new_ambiguous.txt >> /tmp/smart-import-new.ts
tail -n +$((END_LINE + 1)) "$FILE" >> /tmp/smart-import-new.ts

# Backup and replace
cp "$FILE" "$FILE.backup"
mv /tmp/smart-import-new.ts "$FILE"

echo "✅ Updated $FILE with live search functionality"
echo "Backup saved to $FILE.backup"
