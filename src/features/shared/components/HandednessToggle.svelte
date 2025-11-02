<script lang="ts">
	import preferences from '$lib/stores/preferences';
</script>

<div class="handedness-toggle">
	<label>
		<input
			type="checkbox"
			checked={$preferences.isLeftHanded}
			on:change={(e) => preferences.setLeftHanded(e.currentTarget.checked)}
		/>
		<span>{$preferences.isLeftHanded ? 'Left-handed' : 'Right-handed'}</span>
	</label>
</div>

<style>
	.handedness-toggle {
		padding: 0.5rem;
		font-size: 0.8rem;
		display: inline-flex;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	input {
		cursor: pointer;
	}

	span {
		user-select: none;
	}
</style>
