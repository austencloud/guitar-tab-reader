<script lang="ts">
	import { RefreshCw, X } from 'lucide-svelte';

	let showUpdate = $state(false);
	let registration: ServiceWorkerRegistration | null = $state(null);

	$effect(() => {
		if ('serviceWorker' in navigator) {
			// Check for updates every 60 seconds
			const updateInterval = setInterval(() => {
				navigator.serviceWorker.ready.then((reg) => {
					reg.update();
				});
			}, 60000);

			// Listen for service worker updates
			navigator.serviceWorker.ready.then((reg) => {
				registration = reg;

				// Check if there's a waiting service worker
				if (reg.waiting) {
					showUpdate = true;
				}

				// Listen for new service worker installing
				const handleUpdateFound = () => {
					const newWorker = reg.installing;
					if (newWorker) {
						const handleStateChange = () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// New service worker is installed and waiting
								showUpdate = true;
							}
						};
						newWorker.addEventListener('statechange', handleStateChange);
					}
				};
				reg.addEventListener('updatefound', handleUpdateFound);
			});

			// Listen for controller change (new service worker activated)
			const handleControllerChange = () => {
				// Reload the page to get the new version
				window.location.reload();
			};
			navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

			return () => {
				clearInterval(updateInterval);
				navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
			};
		}
	});

	function handleUpdate() {
		if (registration?.waiting) {
			// Tell the waiting service worker to skip waiting
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	}

	function handleDismiss() {
		showUpdate = false;
	}
</script>

{#if showUpdate}
	<div class="update-notification">
		<div class="update-content">
			<div class="update-icon">
				<RefreshCw size={20} />
			</div>
			<div class="update-text">
				<strong>Update Available</strong>
				<p>A new version of TabScroll is ready!</p>
			</div>
		</div>
		<div class="update-actions">
			<button class="update-button" onclick={handleUpdate}>
				Update Now
			</button>
			<button class="dismiss-button" onclick={handleDismiss} aria-label="Dismiss">
				<X size={18} />
			</button>
		</div>
	</div>
{/if}

<style>
	.update-notification {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 9999;
		max-width: 90%;
		width: 400px;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.update-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.update-icon {
		width: 40px;
		height: 40px;
		background: #4caf50;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
		animation: rotate 2s linear infinite;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.update-text {
		flex: 1;
	}

	.update-text strong {
		display: block;
		color: #333;
		font-size: 0.95rem;
		margin-bottom: 0.25rem;
	}

	.update-text p {
		margin: 0;
		color: #666;
		font-size: 0.85rem;
	}

	.update-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.update-button {
		background: #4caf50;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.update-button:hover {
		background: #45a049;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	.update-button:active {
		transform: translateY(0);
	}

	.dismiss-button {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 8px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		transition: all 0.2s;
	}

	.dismiss-button:hover {
		background: #f0f0f0;
		color: #333;
	}

	@media (max-width: 640px) {
		.update-notification {
			bottom: 10px;
			left: 10px;
			right: 10px;
			transform: none;
			width: auto;
			max-width: none;
		}

		@keyframes slideUp {
			from {
				opacity: 0;
				transform: translateY(20px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	@media (prefers-color-scheme: dark) {
		.update-notification {
			background: #1e1e1e;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		}

		.update-text strong {
			color: #fff;
		}

		.update-text p {
			color: #aaa;
		}

		.dismiss-button {
			color: #aaa;
		}

		.dismiss-button:hover {
			background: #333;
			color: #fff;
		}
	}
</style>

