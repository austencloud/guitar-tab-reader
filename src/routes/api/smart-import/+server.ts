import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import {
	IntentCache,
	IntentAnalyzer,
	AutoCorrector,
	AmbiguityHandler,
	UltimateGuitarClient,
	TabImporter
} from '$lib/services/smart-import';

// Initialize singleton services
const cache = new IntentCache(15); // 15 minute TTL
const autoCorrector = new AutoCorrector();

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { query } = await request.json();

		if (!query || typeof query !== 'string') {
			return json({ success: false, error: 'Invalid query' }, { status: 400 });
		}

		console.log(`🤖 Smart import request: "${query}"`);

		// Initialize request-scoped services
		const intentAnalyzer = new IntentAnalyzer(cache, env.ANTHROPIC_API_KEY);
		const ambiguityHandler = new AmbiguityHandler();
		const ugClient = new UltimateGuitarClient(fetch);
		const tabImporter = new TabImporter(ugClient);

		// Analyze the query to determine intent
		const intent = await intentAnalyzer.analyze(query);
		console.log(`🧠 Detected intent:`, intent);

		if (!intent || !intent.type) {
			return json(
				{
					success: false,
					error: 'Could not understand your request. Try "artist name" or "song name by artist"'
				},
				{ status: 400 }
			);
		}

		// Handle ambiguous queries
		if (intent.type === 'AMBIGUOUS') {
			console.log(`❓ Ambiguous query detected: ${intent.ambiguityReason}`);

			// Check if this is a simple typo with a clear correction
			const autoCorrectionResult = autoCorrector.shouldAutoCorrect(intent);

			if (autoCorrectionResult.shouldAutoCorrect) {
				const correctedQuery = autoCorrectionResult.correctedQuery!;
				console.log(`🔄 Auto-correcting "${query}" → "${correctedQuery}"`);

				// Re-analyze with the corrected query
				const correctedIntent = await intentAnalyzer.analyze(correctedQuery);

				if (correctedIntent && correctedIntent.type !== 'AMBIGUOUS') {
					// Execute the import with corrected intent
					const result = await tabImporter.executeImport(correctedIntent);

					// Mark this as auto-corrected in metadata
					return json({
						...result,
						autoCorrection: { from: query, to: correctedQuery }
					});
				}
			}

			// Otherwise, show disambiguation UI
			return json(ambiguityHandler.createDisambiguationResponse(query, intent));
		}

		// Execute the import workflow
		const result = await tabImporter.executeImport(intent);
		return json(result);
	} catch (error) {
		console.error('❌ Smart import error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
