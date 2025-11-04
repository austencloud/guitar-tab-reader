<script lang="ts">
	import type { Tab } from '$lib/stores/tabs';
	import { BottomSheet } from '$features/shared/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onimport?: (tab: Tab) => void;
	}

	let { open = $bindable(false), onclose, onimport }: Props = $props();

	type Message = {
		role: 'user' | 'assistant';
		content: string;
		isGenerating?: boolean;
	};

	let songQuery = $state('');
	let messages = $state<Message[]>([
		{
			role: 'assistant',
			content:
				'Hi! I can help you find and format guitar tabs. Just tell me the song name and artist, and I\'ll search for existing tabs online and format them nicely for you. For example: "Wonderwall by Oasis"'
		}
	]);
	let isLoading = $state(false);
	let generatedTab = $state<Tab | null>(null);

	function resetForm() {
		songQuery = '';
		messages = [
			{
				role: 'assistant',
				content:
					'Hi! I can help you find and format guitar tabs. Just tell me the song name and artist, and I\'ll search for existing tabs online and format them nicely for you. For example: "Wonderwall by Oasis"'
			}
		];
		isLoading = false;
		generatedTab = null;
	}

	function closeModal() {
		resetForm();
		onclose?.();
	}

	async function handleGenerate() {
		if (!songQuery.trim()) return;

		// Add user message
		messages = [
			...messages,
			{
				role: 'user',
				content: songQuery
			}
		];

		const currentQuery = songQuery;
		songQuery = '';
		isLoading = true;

		// Add initial loading message
		messages = [
			...messages,
			{
				role: 'assistant',
				content: 'Starting search...',
				isGenerating: true
			}
		];

		try {
			// Use Server-Sent Events for real-time progress
			const response = await fetch('/api/generate-tab-stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: currentQuery })
			});

			if (!response.ok || !response.body) {
				throw new Error('Failed to start streaming');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// Process complete messages (separated by \n\n)
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || ''; // Keep incomplete message in buffer

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;

					const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix

					// Remove old generating message
					messages = messages.filter((m) => !m.isGenerating);

					if (data.error) {
						// Error occurred
						messages = [
							...messages,
							{
								role: 'assistant',
								content: `Sorry, I couldn't find a tab for that song. ${data.error}`
							}
						];
					} else if (data.success && data.tab) {
						// Success - final result
						generatedTab = data.tab;
						messages = [
							...messages,
							{
								role: 'assistant',
								content: `Great! I found and formatted a tab for "${data.tab.title}"${data.tab.artist ? ` by ${data.tab.artist}` : ''}.\n\n${data.sources ? `Sources:\n${data.sources.map((s: string) => `- ${s}`).join('\n')}` : ''}\n\nYou can preview it below and save it to your collection!`
							}
						];
					} else if (data.step) {
						// Progress update - show live status
						const progressMsg = data.details
							? `${data.step}: ${data.details}`
							: data.step;

						messages = [
							...messages,
							{
								role: 'assistant',
								content: progressMsg,
								isGenerating: true
							}
						];
					}
				}
			}

			// Remove any remaining generating message
			messages = messages.filter((m) => !m.isGenerating);
		} catch (error) {
			messages = messages.filter((m) => !m.isGenerating);
			messages = [
				...messages,
				{
					role: 'assistant',
					content: `Error: ${error instanceof Error ? error.message : 'Failed to find and format tab. Please try again.'}`
				}
			];
		} finally {
			isLoading = false;
		}
	}

	function handleSaveTab() {
		if (generatedTab) {
			onimport?.(generatedTab);
			closeModal();
		}
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	}
</script>

<BottomSheet bind:open onOpenChange={(newOpen) => !newOpen && closeModal()} title="AI Tab Generator">
	<div class="ai-generator-content">
		<div class="panel-content">
				<div class="chat-container">
					{#each messages as message}
						<div class="message {message.role}">
							<div class="message-content">
								{#if message.isGenerating}
									<div class="generating">
										<span class="spinner"></span>
										{message.content}
									</div>
								{:else}
									{message.content}
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if generatedTab}
					<div class="preview-section">
						<h3>Generated Tab Preview</h3>
						<div class="tab-info">
							<strong>{generatedTab.title}</strong>
							{#if generatedTab.artist}
								<span class="artist">by {generatedTab.artist}</span>
							{/if}
						</div>
						<div class="tab-preview">
							<pre>{generatedTab.content}</pre>
						</div>
					</div>
				{/if}

				<div class="panel-footer">
					{#if !generatedTab}
						<div class="input-container">
							<input
								type="text"
								bind:value={songQuery}
								onkeypress={handleKeyPress}
								placeholder='Enter song and artist (e.g., "Wonderwall by Oasis")'
								disabled={isLoading}
							/>
							<button onclick={handleGenerate} disabled={isLoading || !songQuery.trim()}>
								{isLoading ? 'Generating...' : 'Generate'}
							</button>
						</div>
					{:else}
						<div class="action-buttons">
							<button class="back-btn" onclick={() => (generatedTab = null)}>Generate Another</button
							>
							<button class="save-btn" onclick={handleSaveTab}>Save to My Tabs</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
</BottomSheet>

<style>
	.ai-generator-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.chat-container {
		flex: 1;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}

	.message {
		display: flex;
		animation: fadeInMessage 0.3s ease;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message-content {
		max-width: 80%;
		padding: 0.85rem 1.15rem;
		border-radius: 16px;
		white-space: pre-wrap;
		line-height: 1.5;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.message.user .message-content {
		background-color: #4caf50;
		color: white;
		border-bottom-right-radius: 4px;
	}

	.message.assistant .message-content {
		background-color: #f0f0f0;
		color: #333;
		border-bottom-left-radius: 4px;
	}

	.generating {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #ddd;
		border-top-color: #4caf50;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.preview-section {
		padding: 0 1.5rem 1.5rem;
		border-top: 1px solid #e5e5e5;
	}

	.preview-section h3 {
		margin: 1rem 0 0.5rem;
		font-size: 1.1rem;
		color: #333;
	}

	.tab-info {
		margin-bottom: 0.75rem;
	}

	.tab-info .artist {
		color: #666;
		margin-left: 0.5rem;
	}

	.tab-preview {
		background-color: #f5f5f5;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
		max-height: 250px;
		overflow-y: auto;
	}

	.tab-preview pre {
		font-family: 'Courier New', monospace;
		padding: 1rem;
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.4;
		white-space: pre-wrap;
	}

	.panel-footer {
		padding: 1.25rem 1.5rem;
		border-top: 1px solid #e5e5e5;
		background-color: #fafafa;
	}

	.input-container {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.input-container input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #ddd;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.input-container input:focus {
		border-color: #4caf50;
		outline: none;
		box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
	}

	.input-container button,
	.save-btn,
	.back-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.input-container button {
		background-color: #4caf50;
		color: white;
		min-width: 100px;
	}

	.input-container button:hover:not(:disabled) {
		background-color: #43a047;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	.input-container button:active:not(:disabled) {
		transform: translateY(0);
	}

	.input-container button:disabled {
		background-color: #a5d6a7;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.save-btn {
		background-color: #4caf50;
		color: white;
	}

	.save-btn:hover {
		background-color: #43a047;
	}

	.back-btn {
		background-color: #f5f5f5;
		color: #333;
		border: 1px solid #ccc;
	}

	.back-btn:hover {
		background-color: #e0e0e0;
	}

	@keyframes fadeInMessage {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-color-scheme: dark) {
		.message.assistant .message-content {
			background-color: #333;
			color: #e0e0e0;
		}

		.tab-preview {
			background-color: #333;
			border-color: #555;
		}

		.tab-preview pre {
			color: #e0e0e0;
		}

		.preview-section {
			border-color: #444;
		}

		.preview-section h3,
		.tab-info strong {
			color: #e0e0e0;
		}

		.tab-info .artist {
			color: #aaa;
		}

		.input-container input {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.back-btn {
			background-color: #2a2a2a;
			border: 1px solid #444;
			color: #e0e0e0;
		}

		.back-btn:hover {
			background-color: #333;
		}

		.panel-footer {
			border-color: #333;
			background-color: #1a1a1a;
		}
	}

	@media (max-width: 600px) {
		.panel-container {
			max-height: 90vh;
			border-radius: 20px 20px 0 0;
		}

		.message-content {
			max-width: 85%;
			font-size: 0.95rem;
		}

		.tab-preview {
			max-height: 200px;
		}

		.tab-preview pre {
			font-size: 0.85rem;
		}

		.action-buttons {
			flex-direction: column;
		}

		.input-container {
			flex-direction: column;
		}

		.input-container button {
			width: 100%;
		}
	}
</style>
