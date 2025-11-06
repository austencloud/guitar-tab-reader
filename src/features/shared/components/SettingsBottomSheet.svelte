<script lang="ts">
	import BottomSheet from './BottomSheet.svelte';
	import SettingsContent from './settings/SettingsContent.svelte';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			onclose?.();
		}
	}
</script>

<BottomSheet bind:open onOpenChange={handleOpenChange} title="Settings">
	<SettingsContent />
</BottomSheet>

<style>
	/* All styles moved to child components */
</style>

