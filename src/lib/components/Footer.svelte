<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let currentYear = $state(new Date().getFullYear());
	let buildInfo = $state({ version: '1.0.0', buildDate: '' });

	onMount(() => {
		if (browser) {
			// Get build info from package.json or environment
			buildInfo = {
				version: '1.0.0', // This could be imported from package.json
				buildDate: new Date().toLocaleDateString()
			};
		}
	});

	const links = [
		{
			title: 'Features',
			items: [
				{ name: 'Tab Viewer', href: '#' },
				{ name: 'Chord Diagrams', href: '#' },
				{ name: 'Guitar Tuner', href: '#' },
				{ name: 'Tab Editor', href: '#' }
			]
		},
		{
			title: 'Resources',
			items: [
				{ name: 'Help & Support', href: '#' },
				{ name: 'Keyboard Shortcuts', href: '#' },
				{ name: 'File Formats', href: '#' },
				{ name: 'User Guide', href: '#' }
			]
		},
		{
			title: 'Community',
			items: [
				{ name: 'GitHub', href: 'https://github.com', external: true },
				{ name: 'Report Issues', href: '#' },
				{ name: 'Feature Requests', href: '#' },
				{ name: 'Contribute', href: '#' }
			]
		}
	];

	function handleLinkClick(href: string, external?: boolean) {
		if (external && browser) {
			window.open(href, '_blank', 'noopener,noreferrer');
		}
		// For internal links, you could use goto() from $app/navigation
	}
</script>

<footer class="footer">
	<div class="footer-content">
		<div class="footer-main">
			<!-- Brand Section -->
			<div class="footer-brand">
				<div class="brand-info">
					<h3 class="brand-title">Guitar Tab Reader</h3>
					<p class="brand-description">
						A modern, feature-rich guitar tablature reader and editor for musicians of all levels.
					</p>
				</div>
				<div class="app-info">
					<div class="version-info">
						<span class="version">v{buildInfo.version}</span>
						<span class="build-date">Built {buildInfo.buildDate}</span>
					</div>
				</div>
			</div>

			<!-- Links Sections -->
			<div class="footer-links">
				{#each links as section (section.title)}
					<div class="link-section">
						<h4 class="section-title">{section.title}</h4>
						<ul class="link-list">
							{#each section.items as link (link.href)}
								<li>
									<button
										class="footer-link"
										onclick={() => handleLinkClick(link.href, link.external)}
										aria-label={link.name}
									>
										{link.name}
										{#if link.external}
											<svg
												class="external-icon"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
												<polyline
													points="15,3 21,3 21,9"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
												<line
													x1="10"
													y1="14"
													x2="21"
													y2="3"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										{/if}
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>

		<!-- Footer Bottom -->
		<div class="footer-bottom">
			<div class="copyright">
				<p>&copy; {currentYear} Guitar Tab Reader. Made with ❤️ for musicians.</p>
			</div>
			<div class="footer-meta">
				<span class="tech-stack">Built with SvelteKit</span>
				<span class="separator">•</span>
				<span class="open-source">Open Source</span>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		background-color: var(--color-surface-variant);
		border-top: 1px solid var(--color-border);
		margin-top: auto;
		transition: var(--transition-colors);
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-2xl) var(--spacing-md) var(--spacing-md);
	}

	.footer-main {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: var(--spacing-2xl);
		margin-bottom: var(--spacing-xl);
	}

	/* Brand Section */
	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.brand-title {
		margin: 0 0 var(--spacing-sm);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.brand-description {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.6;
		max-width: 300px;
	}

	.app-info {
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--color-border);
	}

	.version-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.version {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-primary);
	}

	.build-date {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
	}

	/* Links Section */
	.footer-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--spacing-xl);
	}

	.link-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.section-title {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.link-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.footer-link {
		background: none;
		border: none;
		padding: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-colors);
		text-align: left;
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.footer-link:hover {
		color: var(--color-primary);
	}

	.external-icon {
		width: 12px;
		height: 12px;
		opacity: 0.6;
	}

	/* Footer Bottom */
	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}

	.copyright p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.footer-meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
	}

	.separator {
		opacity: 0.5;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.footer-main {
			grid-template-columns: 1fr;
			gap: var(--spacing-xl);
		}

		.footer-links {
			grid-template-columns: repeat(2, 1fr);
			gap: var(--spacing-lg);
		}

		.footer-bottom {
			flex-direction: column;
			text-align: center;
			gap: var(--spacing-sm);
		}
	}

	@media (max-width: 480px) {
		.footer-content {
			padding: var(--spacing-xl) var(--spacing-sm) var(--spacing-sm);
		}

		.footer-links {
			grid-template-columns: 1fr;
		}
	}
</style>
