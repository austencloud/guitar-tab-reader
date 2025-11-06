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

// Server-Sent Events endpoint for real-time progress updates
export const POST: RequestHandler = async ({ request, fetch }) => {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			// Helper to send progress updates
			const sendProgress = (step: string, details?: string) => {
				const data = JSON.stringify({ step, details, timestamp: Date.now() });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			};

			const sendError = (error: string, suggestions?: string[]) => {
				const data = JSON.stringify({ error, suggestions, timestamp: Date.now() });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				controller.close();
			};

			const sendComplete = (result: any) => {
				const data = JSON.stringify({ success: true, result, timestamp: Date.now() });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				controller.close();
			};

			const sendDisambiguation = (disambiguationData: any) => {
				const data = JSON.stringify({
					success: true,
					needsDisambiguation: true,
					disambiguationData,
					timestamp: Date.now()
				});
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				controller.close();
			};

			try {
				const { query } = await request.json();

				if (!query || typeof query !== 'string') {
					sendError('Invalid query');
					return;
				}

				console.log(`🤖 Smart import stream request: "${query}"`);
				sendProgress('Analyzing your request', `Processing: "${query}"`);

				// Initialize request-scoped services
				const intentAnalyzer = new IntentAnalyzer(cache, env.ANTHROPIC_API_KEY);
				const ambiguityHandler = new AmbiguityHandler();
				const ugClient = new UltimateGuitarClient(fetch);
				const tabImporter = new TabImporter(ugClient);

				// Analyze the query to determine intent
				sendProgress('Understanding your request', 'Using AI to analyze what you want to import...');
				const intent = await intentAnalyzer.analyze(query, sendProgress);
				console.log(`🧠 Detected intent:`, intent);

				if (!intent || !intent.type) {
					sendError(
						'Could not understand your request. Try "artist name" or "song name by artist"'
					);
					return;
				}

				// Handle ambiguous queries
				if (intent.type === 'AMBIGUOUS') {
					console.log(`❓ Ambiguous query detected: ${intent.ambiguityReason}`);
					sendProgress('Checking for typos', 'Analyzing if this might be a simple typo...');

					// Check if this is a simple typo with a clear correction
					const autoCorrectionResult = autoCorrector.shouldAutoCorrect(intent);

					if (autoCorrectionResult.shouldAutoCorrect) {
						const correctedQuery = autoCorrectionResult.correctedQuery!;
						console.log(`🔄 Auto-correcting "${query}" → "${correctedQuery}"`);
						sendProgress(
							'Auto-correcting typo',
							`Correcting "${query}" to "${correctedQuery}"`
						);

						// Re-analyze with the corrected query
						const correctedIntent = await intentAnalyzer.analyze(correctedQuery, sendProgress);

						if (correctedIntent && correctedIntent.type !== 'AMBIGUOUS') {
							// Execute the import with corrected intent
							sendProgress('Importing corrected query', 'Fetching tab data...');
							const result = await tabImporter.executeImport(correctedIntent, sendProgress);

							// Mark this as auto-corrected in metadata
							sendComplete({
								...result,
								autoCorrection: { from: query, to: correctedQuery }
							});
							return;
						}
					}

					// Otherwise, show disambiguation UI
					sendDisambiguation(ambiguityHandler.createDisambiguationResponse(query, intent));
					return;
				}

				// Execute the import workflow
				sendProgress('Starting import', 'Fetching tab data from Ultimate Guitar...');
				const result = await tabImporter.executeImport(intent, sendProgress);

				console.log('🎯 Import result:', result);
				console.log('🎯 Result type:', result.type);
				console.log('🎯 Result success:', result.success);
				console.log('🎯 Tabs count:', result.tabs?.length || result.count);

				if (result.success) {
					console.log('✅ Sending completion message...');
					sendComplete(result);
					console.log('✅ Completion message sent');
				} else {
					console.log('❌ Sending error message...');
					sendError(result.error || 'Import failed', result.suggestions);
				}
			} catch (error) {
				console.error('❌ Smart import stream error:', error);
				sendError(error instanceof Error ? error.message : 'Unknown error');
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

