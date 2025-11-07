<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { SessionState } from '$features/sessions/state/session.svelte';

	interface Props {
		sessionState?: SessionState;
	}

	let { sessionState }: Props = $props();

	let sessionName = $state('');
	let deviceName = $state('');

	// Get device name from browser
	$effect(() => {
		if (typeof navigator !== 'undefined') {
			const userAgent = navigator.userAgent;
			if (/iPhone/.test(userAgent)) {
				deviceName = 'iPhone';
			} else if (/iPad/.test(userAgent)) {
				deviceName = 'iPad';
			} else if (/Android/.test(userAgent)) {
				deviceName = 'Android';
			} else if (/Mac/.test(userAgent)) {
				deviceName = 'Mac';
			} else if (/Win/.test(userAgent)) {
				deviceName = 'PC';
			} else {
				deviceName = 'Device';
			}
		}
	});

	async function handleCreate() {
		if (!sessionName.trim() || !deviceName.trim() || !sessionState) {
			console.error('Cannot create session: missing required data', {
				hasSessionName: !!sessionName.trim(),
				hasDeviceName: !!deviceName.trim(),
				hasSessionState: !!sessionState
			});
			return;
		}

		try {
			console.log('Creating session...', { sessionName: sessionName.trim(), deviceName: deviceName.trim() });
			await sessionState.createSession(sessionName.trim(), deviceName.trim());
			console.log('Session created successfully');
		} catch (error) {
			console.error('Failed to create session:', error);
		}
	}

	function handleClose() {
		sessionState?.closeCreateModal();
		sessionName = '';
	}
</script>

{#if sessionState?.showCreateModal}
	<div class="modal-overlay" onclick={handleClose} onkeydown={(e) => e.key === 'Escape' && handleClose()} role="button" tabindex="-1">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<div class="modal-header">
				<h2>Create Jam Session</h2>
				<button class="close-button" onclick={handleClose} aria-label="Close">
					<X size={24} />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
				<div class="form-group">
					<label for="session-name">Session Name</label>
					<input
						id="session-name"
						type="text"
						bind:value={sessionName}
						placeholder="Sunday Jam"
						required
						autocomplete="off"
						data-lpignore="true"
						data-form-type="other"
					/>
				</div>

				<div class="form-group">
					<label for="device-name">Your Device Name</label>
					<input
						id="device-name"
						type="text"
						bind:value={deviceName}
						placeholder="Alex's iPhone"
						required
						autocomplete="off"
						data-lpignore="true"
						data-form-type="other"
					/>
				</div>

				{#if sessionState?.error}
					<div class="error-message">
						{sessionState.error}
					</div>
				{/if}

				<div class="button-group">
					<button type="button" class="button-secondary" onclick={handleClose}>
						Cancel
					</button>
					<button
						type="submit"
						class="button-primary"
						disabled={sessionState?.isConnecting || !sessionName.trim() || !deviceName.trim()}
					>
						{sessionState?.isConnecting ? 'Creating...' : 'Create Session'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 28rem;
		width: 100%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: #111827;
	}

	.close-button {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: #6b7280;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: #f3f4f6;
		color: #111827;
	}

	form {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.error-message {
		padding: 0.75rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		color: #dc2626;
		font-size: 0.875rem;
		margin-bottom: 1.25rem;
	}

	.button-group {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.button-secondary,
	.button-primary {
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.button-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.button-secondary:hover {
		background: #e5e7eb;
	}

	.button-primary {
		background: #3b82f6;
		color: white;
	}

	.button-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.button-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (prefers-color-scheme: dark) {
		.modal-content {
			background: #1f2937;
		}

		.modal-header {
			border-bottom-color: #374151;
		}

		.modal-header h2 {
			color: #f9fafb;
		}

		.close-button {
			color: #9ca3af;
		}

		.close-button:hover {
			background: #374151;
			color: #f9fafb;
		}

		.form-group label {
			color: #d1d5db;
		}

		.form-group input {
			background: #111827;
			border-color: #4b5563;
			color: #f9fafb;
		}

		.form-group input:focus {
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		.button-secondary {
			background: #374151;
			color: #d1d5db;
		}

		.button-secondary:hover {
			background: #4b5563;
		}
	}
</style>
