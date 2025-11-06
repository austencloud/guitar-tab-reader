import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

async function generateAssets() {
	// Check if Sharp is installed
	let sharp;
	try {
		sharp = (await import('sharp')).default;
	} catch (e) {
		console.log('Installing Sharp image processing library...');
		exec('npm install --no-save sharp', (error) => {
			if (error) {
				console.error('Error installing Sharp:', error);
				return;
			}
			console.log('Sharp installed successfully, rerun this script');
		});
		process.exit(0);
	}

	// Paths
	const staticDir = path.join(process.cwd(), 'static');
	const splashDir = path.join(staticDir, 'splash');

	// Create directories if they don't exist
	if (!fs.existsSync(splashDir)) {
		fs.mkdirSync(splashDir, { recursive: true });
	}

	const screenshotsDir = path.join(staticDir, 'screenshots');
	if (!fs.existsSync(screenshotsDir)) {
		fs.mkdirSync(screenshotsDir, { recursive: true });
	}

	// Source icon
	const sourceIcon = path.join(staticDir, 'favicon.png');

	// Apple icon sizes
	const appleIconSizes = [
		{ size: 180, name: 'apple-touch-icon.png' },
		{ size: 152, name: 'apple-touch-icon-152x152.png' },
		{ size: 167, name: 'apple-touch-icon-167x167.png' }
	];

	// PWA icon sizes
	const pwaIconSizes = [
		{ size: 512, name: 'icon-512.png' },
		{ size: 192, name: 'icon-192.png' },
		{ size: 144, name: 'icon-144.png' },
		{ size: 128, name: 'icon-128.png' },
		{ size: 96, name: 'icon-96.png' },
		{ size: 72, name: 'icon-72.png' },
		{ size: 48, name: 'icon-48.png' }
	];

	// Splash screen sizes
	const splashScreenSizes = [
		{ width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X
		{ width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone 11 Pro Max
		{ width: 828, height: 1792, name: 'apple-splash-828-1792.png' }, // iPhone 11
		{ width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' } // iPad
	];

	// Process Apple icons
	console.log('Generating Apple icons...');
	appleIconSizes.forEach(({ size, name }) => {
		sharp(sourceIcon)
			.resize({ width: size, height: size })
			.toFile(path.join(staticDir, name))
			.then(() => console.log(`Created ${name}`))
			.catch((err) => console.error(`Error creating ${name}:`, err));
	});

	// Process PWA icons
	console.log('Generating PWA icons...');
	pwaIconSizes.forEach(({ size, name }) => {
		sharp(sourceIcon)
			.resize({ width: size, height: size })
			.toFile(path.join(staticDir, name))
			.then(() => console.log(`Created ${name}`))
			.catch((err) => console.error(`Error creating ${name}:`, err));
	});

	// Process splash screens
	console.log('Generating splash screens...');
	// Set background color from manifest
	const backgroundColor = '#4caf50'; // Your theme color

	splashScreenSizes.forEach(({ width, height, name }) => {
		const iconSize = Math.min(width, height) * 0.5; // Icon size is 50% of smallest dimension

		sharp({
			create: {
				width,
				height,
				channels: 4,
				background: backgroundColor
			}
		})
			.composite([
				{
					input: sourceIcon,
					gravity: 'center',
					width: iconSize,
					height: iconSize
				}
			])
			.toFile(path.join(splashDir, name))
			.then(() => console.log(`Created ${name}`))
			.catch((err) => console.error(`Error creating ${name}:`, err));
	});

	// Create a placeholder screenshot
	console.log('Creating placeholder screenshot...');
	sharp({
		create: {
			width: 750,
			height: 1334,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 }
		}
	})
		.composite([
			{
				input: Buffer.from(
					`<svg width="750" height="1334">
        <rect x="0" y="0" width="750" height="1334" fill="#ffffff" />
        <text x="375" y="667" font-family="Arial" font-size="40" text-anchor="middle" fill="#4caf50">TabScroll Screenshot</text>
      </svg>`
				),
				gravity: 'center'
			}
		])
		.toFile(path.join(screenshotsDir, 'mobile-home.png'))
		.then(() => console.log('Created placeholder screenshot'))
		.catch((err) => console.error('Error creating screenshot:', err));

	console.log(
		'Asset generation complete! Replace placeholder screenshot with an actual screenshot of your app.'
	);
}

// Run the function
generateAssets().catch(console.error);
