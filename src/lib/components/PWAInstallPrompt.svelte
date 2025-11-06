<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Download } from 'lucide-svelte';

	let showPrompt = $state(false);
	let deferredPrompt: any = $state(null);
	let isIOS = $state(false);
	let isStandalone = $state(false);

	onMount(() => {
		// Check if running in standalone mode
		isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true;

		// Check if iOS
		isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

		// Don't show prompt if already installed
		if (isStandalone) {
			return;
		}

		// Check if user has previously dismissed the prompt
		const dismissed = localStorage.getItem('pwa-install-dismissed');
		if (dismissed) {
			const dismissedTime = parseInt(dismissed);
			const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
			// Show again after 7 days
			if (daysSinceDismissed < 7) {
				return;
			}
		}

		// Listen for the beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			// Show the install prompt after a short delay
			setTimeout(() => {
				showPrompt = true;
			}, 3000);
		});

		// For iOS, show custom instructions after a delay
		if (isIOS && !isStandalone) {
			setTimeout(() => {
				showPrompt = true;
			}, 3000);
		}
	});

	async function handleInstall() {
		if (!deferredPrompt) {
			return;
		}

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
		} else {
			console.log('User dismissed the install prompt');
		}

		// Clear the deferredPrompt
		deferredPrompt = null;
		showPrompt = false;
	}

	function handleDismiss() {
		showPrompt = false;
		localStorage.setItem('pwa-install-dismissed', Date.now().toString());
	}
</script>

{#if showPrompt}
	<div class="pwa-prompt-overlay" onclick={handleDismiss}>
		<div class="pwa-prompt" onclick={(e) => e.stopPropagation()}>
			<button class="close-button" onclick={handleDismiss} aria-label="Close">
				<X size={20} />
			</button>

			<div class="prompt-content">
				<div class="app-icon">
					<img src="/icon-192.png" alt="TabScroll" />
				</div>

				<h2>Install TabScroll</h2>
				<p>Install this app on your device for a better experience!</p>

				{#if isIOS}
					<div class="ios-instructions">
						<p>To install this app on your iOS device:</p>
						<ol>
							<li>Tap the Share button <span class="share-icon">⎋</span></li>
							<li>Scroll down and tap "Add to Home Screen"</li>
							<li>Tap "Add" in the top right corner</li>
						</ol>
					</div>
				{:else if deferredPrompt}
					<button class="install-button" onclick={handleInstall}>
						<Download size={20} />
						Install App
					</button>
				{/if}

				<button class="dismiss-button" onclick={handleDismiss}>Maybe Later</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pwa-prompt-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.pwa-prompt {
		background: white;
		border-radius: 16px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		position: relative;
		animation: slideUp 0.3s ease-out;
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

	.close-button {
		position: absolute;
		top: 12px;
		right: 12px;
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

	.close-button:hover {
		background: #f0f0f0;
		color: #333;
	}

	.prompt-content {
		padding: 2rem;
		text-align: center;
	}

	.app-icon {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.app-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		color: #333;
	}

	p {
		margin: 0 0 1.5rem;
		color: #666;
		line-height: 1.5;
	}

	.ios-instructions {
		text-align: left;
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.ios-instructions p {
		margin: 0 0 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.ios-instructions ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.ios-instructions li {
		margin: 0.5rem 0;
		color: #666;
	}

	.share-icon {
		display: inline-block;
		font-size: 1.2em;
		vertical-align: middle;
	}

	.install-button {
		background: #4caf50;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		transition: all 0.2s;
		margin-bottom: 0.5rem;
	}

	.install-button:hover {
		background: #45a049;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
	}

	.install-button:active {
		transform: translateY(0);
	}

	.dismiss-button {
		background: transparent;
		color: #666;
		border: none;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dismiss-button:hover {
		background: #f0f0f0;
		color: #333;
	}

	@media (prefers-color-scheme: dark) {
		.pwa-prompt {
			background: #1e1e1e;
		}

		h2 {
			color: #fff;
		}

		p {
			color: #aaa;
		}

		.close-button {
			color: #aaa;
		}

		.close-button:hover {
			background: #333;
			color: #fff;
		}

		.ios-instructions {
			background: #2a2a2a;
		}

		.ios-instructions p {
			color: #fff;
		}

		.ios-instructions li {
			color: #aaa;
		}

		.dismiss-button:hover {
			background: #333;
			color: #fff;
		}
	}
</style>

