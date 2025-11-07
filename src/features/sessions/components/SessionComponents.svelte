<script lang="ts">
	import { useSessionState } from '$lib/useSessionState.svelte';
	import SessionBottomSheet from './SessionBottomSheet.svelte';
	import CreateSessionModal from './CreateSessionModal.svelte';
	import JoinSessionModal from './JoinSessionModal.svelte';
	import SessionQueueView from './SessionQueueView.svelte';

	let { isSessionSheetOpen, onCloseSessions } = $props<{
		isSessionSheetOpen: boolean;
		onCloseSessions: () => void;
	}>();

	let sessionState = $state<ReturnType<typeof useSessionState> | undefined>(undefined);
	let mounted = $state(false);

	$effect(() => {
		try {
			sessionState = useSessionState();
			// Use microtask to ensure reactivity triggers
			Promise.resolve().then(() => {
				mounted = true;
				console.log('✅ SessionComponents mounted with state:', !!sessionState);
			});
		} catch (error) {
			console.error('❌ Failed to initialize session state in SessionComponents:', error);
		}
	});
</script>

{#if mounted && sessionState}
	<SessionBottomSheet isOpen={isSessionSheetOpen} onClose={onCloseSessions} {sessionState} />
	<CreateSessionModal />
	<JoinSessionModal />
	<SessionQueueView />
{/if}
