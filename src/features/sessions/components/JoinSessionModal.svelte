<script lang="ts">
	import { X } from 'lucide-svelte';
	import { normalizeRoomCode, isValidRoomCode } from '../utils/roomCodeGenerator';
	import type { SessionState } from '$features/sessions/state/session.svelte';

	interface Props {
		sessionState?: SessionState;
	}

	let { sessionState }: Props = $props();

	let roomCode = $state('');
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

	function handleCodeInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const normalized = normalizeRoomCode(input.value);
		roomCode = normalized.toUpperCase();
	}

	async function handleJoin() {
		const code = normalizeRoomCode(roomCode);

		if (!isValidRoomCode(code) || !deviceName.trim() || !sessionState) {
			console.error('Cannot join session: missing required data', {
				isCodeValid: isValidRoomCode(code),
				hasDeviceName: !!deviceName.trim(),
				hasSessionState: !!sessionState
			});
			return;
		}

		try {
			console.log('Joining session...', { code, deviceName: deviceName.trim() });
			await sessionState.joinSession(code, deviceName.trim());
			console.log('Joined session successfully');
		} catch (error) {
			console.error('Failed to join session:', error);
		}
	}

	function handleClose() {
		sessionState?.closeJoinModal();
		roomCode = '';
	}

	const isCodeValid = $derived(isValidRoomCode(normalizeRoomCode(roomCode)));
</script>

{#if sessionState?.showJoinModal}
	<div class="modal-overlay" onclick={handleClose}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Join Jam Session</h2>
				<button class="close-button" onclick={handleClose} aria-label="Close">
					<X size={24} />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleJoin(); }}>
				<div class="form-group">
					<label for="room-code">Session Code</label>
					<input
						id="room-code"
						type="text"
						value={roomCode}
						oninput={handleCodeInput}
						placeholder="ABC123"
						maxlength="6"
						autofocus
						required
						autocomplete="off"
						data-lpignore="true"
						data-form-type="other"
						class:invalid={roomCode.length > 0 && !isCodeValid}
					/>
					<p class="help-text">Enter the 6-character code from your friend</p>
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
						disabled={sessionState?.isConnecting || !isCodeValid || !deviceName.trim()}
					>
						{sessionState?.isConnecting ? 'Joining...' : 'Join Session'}
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
		text-transform: uppercase;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group input.invalid {
		border-color: #ef4444;
	}

	.help-text {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.375rem;
		margin-bottom: 0;
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
		}

		.form-group input.invalid {
			border-color: #ef4444;
		}

		.help-text {
			color: #9ca3af;
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
