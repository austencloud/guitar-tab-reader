<script lang="ts">
	interface Props {
		title: string;
		artist: string;
		content: string;
		onTitleChange: (title: string) => void;
		onArtistChange: (artist: string) => void;
		onContentChange: (content: string) => void;
		onImport: () => void;
	}

	let {
		title = $bindable(),
		artist = $bindable(),
		content = $bindable(),
		onImport
	}: Props = $props();
</script>

<div class="preview-view">
	<div class="form-group">
		<label for="preview-title">Tab Title *</label>
		<input id="preview-title" type="text" bind:value={title} />
	</div>

	<div class="form-group">
		<label for="preview-artist">Artist</label>
		<input id="preview-artist" type="text" bind:value={artist} />
	</div>

	<div class="form-group preview-content-group">
		<label for="preview-content">Tab Content *</label>
		<textarea
			id="preview-content"
			bind:value={content}
			rows="15"
			placeholder="Tab content will appear here..."
		></textarea>
		<p class="hint">You can edit the content before saving</p>
	</div>

	<button class="import-btn" onclick={onImport} disabled={!content.trim() || !title.trim()}>
		💾 Save to My Tabs
	</button>
</div>

<style>
	.preview-view {
		padding: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e5e5;
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.form-group textarea {
		font-family: 'Courier New', monospace;
		resize: vertical;
		min-height: 300px;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		border-color: #4caf50;
		outline: none;
	}

	.preview-content-group {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.preview-content-group textarea {
		flex: 1;
	}

	.hint {
		font-size: 0.85rem;
		color: #666;
		margin-top: 0.5rem;
		margin-bottom: 0;
	}

	.import-btn {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
		color: white;
		border: none;
		border-radius: 50px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
		margin-top: 1rem;
	}

	.import-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
	}

	.import-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.form-group label {
			color: #e0e0e0;
		}

		.form-group input,
		.form-group textarea {
			background-color: #333;
			border-color: #555;
			color: #e0e0e0;
		}

		.hint {
			color: #aaa;
		}
	}
</style>

