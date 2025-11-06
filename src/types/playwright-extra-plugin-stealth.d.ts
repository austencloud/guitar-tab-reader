declare module 'playwright-extra-plugin-stealth' {
	import type { CompatiblePlugin } from 'playwright-extra/dist/types';

	export default function StealthPlugin(): CompatiblePlugin;
}
