/**
 * Script to create missing Apple touch icons
 * This creates simple placeholder icons to resolve 404 errors
 */

// Create a simple SVG icon that can be converted to PNG
const iconSvg = `
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="20" fill="url(#grad)"/>
  <g transform="translate(30, 40)">
    <!-- Guitar neck -->
    <rect x="40" y="20" width="80" height="8" fill="white" opacity="0.9"/>
    <rect x="40" y="32" width="80" height="8" fill="white" opacity="0.9"/>
    <rect x="40" y="44" width="80" height="8" fill="white" opacity="0.9"/>
    <rect x="40" y="56" width="80" height="8" fill="white" opacity="0.9"/>
    <rect x="40" y="68" width="80" height="8" fill="white" opacity="0.9"/>
    <rect x="40" y="80" width="80" height="8" fill="white" opacity="0.9"/>
    
    <!-- Frets -->
    <rect x="60" y="15" width="2" height="75" fill="white" opacity="0.7"/>
    <rect x="80" y="15" width="2" height="75" fill="white" opacity="0.7"/>
    <rect x="100" y="15" width="2" height="75" fill="white" opacity="0.7"/>
    
    <!-- Tab numbers -->
    <text x="50" y="35" fill="white" font-family="monospace" font-size="12" font-weight="bold">3</text>
    <text x="50" y="47" fill="white" font-family="monospace" font-size="12" font-weight="bold">2</text>
    <text x="50" y="59" fill="white" font-family="monospace" font-size="12" font-weight="bold">0</text>
    <text x="50" y="71" fill="white" font-family="monospace" font-size="12" font-weight="bold">0</text>
    <text x="50" y="83" fill="white" font-family="monospace" font-size="12" font-weight="bold">3</text>
    <text x="50" y="95" fill="white" font-family="monospace" font-size="12" font-weight="bold">3</text>
  </g>
  
  <!-- App name -->
  <text x="90" y="130" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16" font-weight="bold">TabScroll</text>
</svg>
`;

console.log('SVG Icon created. To convert to PNG files:');
console.log('1. Save the SVG content to a file');
console.log('2. Use an online SVG to PNG converter or image editing software');
console.log('3. Create the following sizes:');
console.log('   - apple-touch-icon.png (180x180)');
console.log('   - apple-touch-icon-152x152.png (152x152)');
console.log('   - apple-touch-icon-180x180.png (180x180)');
console.log('4. Place them in the static/ directory');

// For now, let's remove the problematic references from app.html
console.log('\nSVG Content:');
console.log(iconSvg);
