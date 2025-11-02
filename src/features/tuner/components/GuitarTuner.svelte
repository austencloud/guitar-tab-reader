<!-- src/features/tuner/components/GuitarTuner.svelte -->
<script lang="ts">
	import TunerModal from './TunerModal.svelte';

	interface Props {
		showTuner?: boolean;
		onclose?: () => void;
	}

	let { showTuner = false, onclose }: Props = $props();

	function closeModal() {
		onclose?.();
	}
</script>

<TunerModal open={showTuner} onclose={closeModal} />
