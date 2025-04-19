<!-- src/lib/components/GuitarTuner.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import TunerModal from './tuner/TunerModal.svelte';

	export let showTuner = false;
	
	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	function closeModal() {
		showTuner = false;
		dispatch('close');
	}
</script>

<TunerModal open={showTuner} on:close={closeModal} />