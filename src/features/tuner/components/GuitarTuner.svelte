<!-- src/features/tuner/components/GuitarTuner.svelte -->
<script lang="ts">
	import TunerBottomSheet from './TunerBottomSheet.svelte';

	interface Props {
		showTuner?: boolean;
		onclose?: () => void;
	}

	let { showTuner = false, onclose }: Props = $props();

	function closeModal() {
		onclose?.();
	}
</script>

<TunerBottomSheet open={showTuner} onclose={closeModal} />
