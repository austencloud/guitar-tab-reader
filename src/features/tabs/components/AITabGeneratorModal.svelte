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
		height: 100%;
	}

	.panel-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.7);
		backdrop-filter: var(--blur-md);
		z-index: var(--z-modal);
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.panel-container {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-surface-high);
		border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
		box-shadow: var(--shadow-2xl);
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: calc(var(--z-modal) + 1);
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.panel-handle {
		padding: var(--spacing-md);
		display: flex;
		justify-content: center;
		cursor: pointer;
	}

	.handle-bar {
		width: 40px;
		height: 4px;
		background-color: var(--color-border);
		border-radius: var(--radius-sm);
	}

	.panel-header {
		padding: 0 var(--spacing-xl) var(--spacing-lg);
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: var(--spacing-sm);
		min-height: var(--touch-target-min);
		min-width: var(--touch-target-min);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-all);
	}

	.close-btn:hover {
		background-color: var(--color-hover);
		color: var(--color-text-primary);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
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
		padding: var(--spacing-xl);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
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
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-xl);
		white-space: pre-wrap;
		line-height: 1.5;
		box-shadow: var(--shadow-sm);
	}

	.message.user .message-content {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		border-bottom-right-radius: var(--radius-sm);
	}

	.message.assistant .message-content {
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		border-bottom-left-radius: var(--radius-sm);
	}

	.generating {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: var(--radius-full);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.preview-section {
		padding: 0 var(--spacing-xl) var(--spacing-xl);
		border-top: 1px solid var(--color-border);
	}

	.preview-section h3 {
		margin: var(--spacing-lg) 0 var(--spacing-sm);
		font-size: var(--font-size-lg);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.tab-info {
		margin-bottom: var(--spacing-md);
	}

	.tab-info strong {
		color: var(--color-text-primary);
	}

	.tab-info .artist {
		color: var(--color-text-secondary);
		margin-left: var(--spacing-sm);
	}

	.tab-preview {
		background-color: var(--color-surface-low);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		max-height: 250px;
		overflow-y: auto;
	}

	.tab-preview pre {
		font-family: 'Courier New', monospace;
		padding: var(--spacing-lg);
		margin: 0;
		font-size: var(--font-size-sm);
		line-height: 1.4;
		white-space: pre-wrap;
		color: var(--color-text-primary);
	}

	.panel-footer {
		padding: var(--spacing-lg) var(--spacing-xl);
		border-top: 1px solid var(--color-border);
		background-color: var(--color-surface-low);
	}

	.input-container {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.input-container input {
		flex: 1;
		padding: var(--spacing-md) var(--spacing-lg);
		min-height: var(--touch-target-min);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		font-size: var(--font-size-base);
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		transition: var(--transition-all);
	}

	.input-container input:focus {
		border-color: var(--color-primary);
		outline: none;
		box-shadow: var(--glow-primary);
	}

	.input-container input:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.input-container button,
	.save-btn,
	.back-btn {
		padding: var(--spacing-md) var(--spacing-xl);
		min-height: var(--touch-target-min);
		border: none;
		border-radius: var(--radius-xl);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		transition: var(--transition-all);
	}

	.input-container button {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		min-width: 100px;
	}

	.input-container button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: var(--glow-primary);
	}

	.input-container button:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.input-container button:active:not(:disabled) {
		transform: translateY(0);
	}

	.input-container button:disabled {
		background: var(--color-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-md);
		justify-content: flex-end;
	}

	.save-btn {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
	}

	.save-btn:hover {
		transform: translateY(-1px);
		box-shadow: var(--glow-primary);
	}

	.save-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.back-btn {
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		border: 2px solid var(--color-border);
	}

	.back-btn:hover {
		background-color: var(--color-hover);
	}

	.back-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
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
