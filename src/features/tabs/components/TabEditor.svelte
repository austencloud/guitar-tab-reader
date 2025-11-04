<script lang="ts">
	import { tabs } from '$lib/stores/tabs';

	interface Props {
		id?: string | null;
		title?: string;
		content?: string;
		artist?: string;
		album?: string;
		onsaved?: (event: { id: string }) => void;
		oncanceled?: () => void;
	}

	let {
		id = null,
		title: initialTitle = '',
		content: initialContent = '',
		artist: initialArtist = '',
		album: initialAlbum = '',
		onsaved,
		oncanceled
	}: Props = $props();

	let title = $state(initialTitle);
	let content = $state(initialContent);
	let artist = $state(initialArtist);
	let album = $state(initialAlbum);
	let isSaving = $state(false);

	const isEditMode = $derived(!!id);

	async function saveTab() {
		if (!title.trim()) {
			alert('Please enter a title for the tab');
			return;
		}

		isSaving = true;

		try {
			let savedId: string;

			if (isEditMode && id) {
				tabs.update(id, { title, content, artist, album });
				savedId = id;
			} else {
				savedId = tabs.add({ title, content, artist, album });
			}

			onsaved?.({ id: savedId });
		} finally {
			isSaving = false;
		}
	}

	function cancel() {
		oncanceled?.();
	}

	// Example tab template for new users
	const exampleTab = `
		e|----3--------------|
		B|----------3--------|
		G|----0-------0------|
		D|-----------0-------|
		A|--3----------------|
		E|-------------------|
	`;

	function insertExampleTab() {
		if (!content) {
			content = exampleTab;
		}
	}
</script>

<div class="tab-editor">
	<div class="form-group">
		<label for="tab-title">Title</label>
		<input
			id="tab-title"
			type="text"
			bind:value={title}
			placeholder="Enter tab title"
			class="title-input"
		/>
	</div>

	<div class="metadata-row">
		<div class="form-group">
			<label for="tab-artist">Artist (optional)</label>
			<input
				id="tab-artist"
				type="text"
				bind:value={artist}
				placeholder="Artist name"
				class="text-input"
			/>
		</div>

		<div class="form-group">
			<label for="tab-album">Album (optional)</label>
			<input
				id="tab-album"
				type="text"
				bind:value={album}
				placeholder="Album name"
				class="text-input"
			/>
		</div>
	</div>

	<div class="form-group content-area">
		<label for="tab-content">Tab Content (Use monospaced text)</label>
		<textarea
			id="tab-content"
			bind:value={content}
			placeholder="Paste or type your tab here..."
			class="content-input"
			spellcheck="false"
		></textarea>

		{#if !content}
			<button class="example-btn" onclick={insertExampleTab}>Insert Example Tab</button>
		{/if}
	</div>

	<div class="button-group">
		<button class="cancel-btn" onclick={cancel}> Cancel </button>
		<button class="save-btn" onclick={saveTab} disabled={isSaving}>
			{isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
		</button>
	</div>
</div>

<style>
	.tab-editor {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: var(--spacing-md);
	}

	.form-group {
		margin-bottom: var(--spacing-lg);
	}

	label {
		display: block;
		margin-bottom: var(--spacing-sm);
		font-weight: var(--font-weight-medium);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.title-input,
	.text-input {
		width: 100%;
		padding: var(--spacing-sm);
		font-size: var(--font-size-base);
		background-color: var(--color-background);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	.title-input:focus,
	.text-input:focus,
	.content-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-dim), var(--glow-primary);
	}

	.title-input:focus-visible,
	.text-input:focus-visible,
	.content-input:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.content-area {
		position: relative;
	}

	.content-input {
		width: 100%;
		min-height: 300px;
		padding: var(--spacing-sm);
		font-size: var(--font-size-sm);
		font-family: 'Courier New', Consolas, Monaco, monospace;
		background-color: var(--color-background);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		resize: vertical;
		white-space: pre;
		overflow-x: auto;
		tab-size: 4;
		transition: var(--transition-all);
	}

	.example-btn {
		position: absolute;
		right: var(--spacing-xs);
		top: 40px;
		background-color: var(--color-surface-low);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	.example-btn:hover {
		background-color: var(--color-hover);
		color: var(--color-text-primary);
		box-shadow: var(--shadow-sm);
	}

	.example-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.button-group {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}

	.save-btn,
	.cancel-btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		border: none;
		border-radius: var(--radius-xl);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--touch-target-min);
	}

	.save-btn {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
		color: var(--color-text-inverse);
		box-shadow: var(--shadow-md);
	}

	.save-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg), var(--glow-primary);
	}

	.save-btn:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.save-btn:disabled {
		background: var(--color-disabled);
		color: var(--color-disabled-text);
		cursor: not-allowed;
		opacity: 0.5;
		box-shadow: none;
	}

	.save-btn:focus-visible,
	.cancel-btn:focus-visible {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.cancel-btn {
		background-color: var(--color-surface-low);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.cancel-btn:hover {
		background-color: var(--color-hover);
		box-shadow: var(--shadow-md);
	}

	.cancel-btn:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.metadata-row {
		display: flex;
		gap: var(--spacing-md);
	}

	.metadata-row .form-group {
		flex: 1;
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.tab-editor {
			padding: var(--spacing-sm);
		}

		.content-input {
			min-height: 200px;
		}

		.metadata-row {
			flex-direction: column;
			gap: var(--spacing-md);
		}

		.button-group {
			gap: var(--spacing-sm);
		}

		.save-btn,
		.cancel-btn {
			flex: 1;
		}
	}
</style>
