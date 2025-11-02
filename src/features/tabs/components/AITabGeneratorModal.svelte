<script lang="ts">
	import type { Tab } from '$lib/stores/tabs';

	interface Props {
		visible?: boolean;
		onclose?: () => void;
		onimport?: (tab: Tab) => void;
	}

	let { visible = false, onclose, onimport }: Props = $props();

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
				'Hi! I can help you generate guitar tabs. Just tell me the song name and artist, and I\'ll create a tab for you with verification from existing tabs online. For example: "Wonderwall by Oasis"'
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
					'Hi! I can help you generate guitar tabs. Just tell me the song name and artist, and I\'ll create a tab for you with verification from existing tabs online. For example: "Wonderwall by Oasis"'
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

		// Add loading message
		messages = [
			...messages,
			{
				role: 'assistant',
				content: 'Generating tab with AI and verifying against online sources...',
				isGenerating: true
			}
		];

		try {
			const response = await fetch('/api/generate-tab', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: currentQuery })
			});

			const data = await response.json();

			// Remove loading message
			messages = messages.filter((m) => !m.isGenerating);

			if (data.success && data.tab) {
				generatedTab = data.tab;
				messages = [
					...messages,
					{
						role: 'assistant',
						content: `Great! I've generated a tab for "${data.tab.title}"${data.tab.artist ? ` by ${data.tab.artist}` : ''}.\n\n${data.sources ? `Verified against:\n${data.sources.map((s: string) => `- ${s}`).join('\n')}` : ''}\n\nYou can preview it below and save it to your collection!`
					}
				];
			} else {
				messages = [
					...messages,
					{
						role: 'assistant',
						content: `Sorry, I couldn't generate a tab. ${data.error || 'Please try rephrasing your request with the format: "Song Name by Artist Name"'}`
					}
				];
			}
		} catch (error) {
			messages = messages.filter((m) => !m.isGenerating);
			messages = [
				...messages,
				{
					role: 'assistant',
					content: `Error: ${error instanceof Error ? error.message : 'Failed to generate tab. Please try again.'}`
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

{#if visible}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="panel-backdrop" onclick={closeModal}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="panel-container" onclick={(e) => e.stopPropagation()}>
			<div class="panel-handle">
				<div class="handle-bar"></div>
			</div>

			<div class="panel-header">
				<h2>AI Tab Generator</h2>
				<button class="close-btn" onclick={closeModal} aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

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
			</div>

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
{/if}

<style>
	.panel-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		z-index: 1000;
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
		background-color: white;
		border-radius: 24px 24px 0 0;
		box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1001;
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
		padding: 0.75rem;
		display: flex;
		justify-content: center;
		cursor: pointer;
	}

	.handle-bar {
		width: 40px;
		height: 4px;
		background-color: #d0d0d0;
		border-radius: 2px;
	}

	.panel-header {
		padding: 0 1.5rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #e5e5e5;
	}

	.panel-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #333;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #666;
		padding: 0.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		width: 36px;
		height: 36px;
	}

	.close-btn:hover {
		background-color: rgba(0, 0, 0, 0.08);
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
		.panel-container {
			background-color: #1a1a1a;
			color: #e0e0e0;
		}

		.handle-bar {
			background-color: #505050;
		}

		.panel-header {
			border-color: #333;
		}

		.panel-header h2 {
			color: #e0e0e0;
		}

		.close-btn {
			color: #aaa;
		}

		.close-btn:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

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
