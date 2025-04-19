<script lang="ts">
	import { tabs } from '../stores/tabs';
	import { createEventDispatcher } from 'svelte';

	export let id: string | null = null;
	export let title: string = '';
	export let content: string = '';
	export let artist: string = '';
	export let album: string = '';

	let isSaving = false;
	const dispatch = createEventDispatcher<{
		saved: { id: string };
		canceled: void;
	}>();

	$: isEditMode = !!id;

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

			dispatch('saved', { id: savedId });
		} finally {
			isSaving = false;
		}
	}

	function cancel() {
		dispatch('canceled');
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
			<button class="example-btn" on:click={insertExampleTab}>Insert Example Tab</button>
		{/if}
	</div>

	<div class="button-group">
		<button class="cancel-btn" on:click={cancel}> Cancel </button>
		<button class="save-btn" on:click={saveTab} disabled={isSaving}>
			{isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
		</button>
	</div>
</div>

<style>
	.tab-editor {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.title-input {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.content-area {
		position: relative;
	}

	.content-input {
		width: 100%;
		min-height: 300px;
		padding: 0.75rem;
		font-size: 14px;
		font-family: 'Courier New', monospace;
		border: 1px solid #ccc;
		border-radius: 4px;
		resize: vertical;
		white-space: pre;
		overflow-x: auto;
		tab-size: 4;
	}

	.example-btn {
		position: absolute;
		right: 8px;
		top: 40px;
		background-color: #eee;
		border: none;
		border-radius: 4px;
		padding: 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.button-group {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.save-btn,
	.cancel-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.save-btn {
		background-color: #4caf50;
		color: white;
	}

	.save-btn:disabled {
		background-color: #a5d6a7;
		cursor: not-allowed;
	}

	.cancel-btn {
		background-color: #f5f5f5;
		color: #333;
	}

	.metadata-row {
		display: flex;
		gap: 1rem;
	}

	.metadata-row .form-group {
		flex: 1;
	}

	.text-input {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.title-input,
		.text-input,
		.content-input {
			background-color: #333;
			color: #fff;
			border-color: #555;
		}

		.example-btn {
			background-color: #444;
			color: #fff;
		}

		.cancel-btn {
			background-color: #444;
			color: #eee;
		}
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.tab-editor {
			padding: 0.5rem;
		}

		.content-input {
			min-height: 200px;
		}

		.metadata-row {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
