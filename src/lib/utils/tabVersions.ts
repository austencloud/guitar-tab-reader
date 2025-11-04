/**
 * Utilities for detecting, grouping, and ranking multiple versions of tabs
 */

export interface TabInfo {
	title: string;
	artist: string;
	url: string;
	type: string;
	rating?: number;
	votes?: number;
}

export interface TabGroup {
	baseTitle: string; // Title without version number
	artist: string;
	type: string;
	versions: TabVersionInfo[];
	recommendedVersion: TabVersionInfo;
	alternateVersions: TabVersionInfo[];
}

export interface TabVersionInfo extends TabInfo {
	versionNumber?: number; // Extracted version number (1, 2, 3, etc.)
	qualityScore: number; // Calculated quality score for ranking
}

/**
 * Normalizes a tab title by removing version indicators
 * Examples:
 *   "Basket Case (ver 2)" -> "basket case"
 *   "Basket Case*" -> "basket case"
 *   "Wonderwall" -> "wonderwall"
 */
function normalizeTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/\s*\(ver\s*\d+\)\s*/gi, '') // Remove (ver 2), (ver 3), etc.
		.replace(/\s*\*\s*/g, '') // Remove asterisks
		.trim();
}

/**
 * Extracts version number from title
 * Examples:
 *   "Basket Case" -> 1
 *   "Basket Case (ver 2)" -> 2
 *   "Wonderwall (ver 5)" -> 5
 */
function extractVersionNumber(title: string): number {
	const match = title.match(/\(ver\s*(\d+)\)/i);
	return match ? parseInt(match[1], 10) : 1;
}

/**
 * Calculates a quality score for a tab based on rating and vote count
 *
 * Algorithm:
 * - Base score starts with rating (1-5 stars)
 * - Vote count is weighted logarithmically to handle huge differences
 * - Higher vote counts increase confidence in the rating
 *
 * Formula: rating * (1 + log10(votes + 1) / 5)
 *
 * This means:
 * - 5 stars with 1,000 votes = 5 * (1 + 3/5) = 8.0
 * - 5 stars with 100 votes = 5 * (1 + 2/5) = 7.0
 * - 4 stars with 5,000 votes = 4 * (1 + 3.7/5) = 6.96
 * - 5 stars with 10 votes = 5 * (1 + 1/5) = 6.0
 *
 * So a tab with slightly lower rating but many more votes can win
 */
export function calculateQualityScore(rating: number = 0, votes: number = 0): number {
	if (rating === 0) return 0;

	// Logarithmic vote weight: more votes = higher confidence, but diminishing returns
	const voteWeight = Math.log10(votes + 1) / 5;

	// Rating multiplied by confidence factor
	const score = rating * (1 + voteWeight);

	return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Groups tabs by song (ignoring version numbers) and returns groups with recommended versions
 *
 * @param tabs Array of tabs to group
 * @returns Array of tab groups, each with recommended and alternate versions
 */
export function groupTabVersions(tabs: TabInfo[]): Map<string, TabGroup> {
	const groups = new Map<string, TabVersionInfo[]>();

	// First, enhance each tab with version info and quality score
	const enhancedTabs: TabVersionInfo[] = tabs.map((tab) => ({
		...tab,
		versionNumber: extractVersionNumber(tab.title),
		qualityScore: calculateQualityScore(tab.rating, tab.votes)
	}));

	// Group tabs by normalized title + type
	// (Different types of the same song should be separate groups)
	enhancedTabs.forEach((tab) => {
		const baseTitle = normalizeTitle(tab.title);
		const groupKey = `${baseTitle}|${tab.type}`;

		if (!groups.has(groupKey)) {
			groups.set(groupKey, []);
		}
		groups.get(groupKey)!.push(tab);
	});

	// Create TabGroup objects with recommended versions
	const result = new Map<string, TabGroup>();

	groups.forEach((versions, groupKey) => {
		// Only create a group if there are multiple versions OR if there's rating data
		if (versions.length === 1 && !versions[0].rating) {
			// Single version with no rating - store as-is without grouping
			const tab = versions[0];
			result.set(groupKey, {
				baseTitle: normalizeTitle(tab.title),
				artist: tab.artist,
				type: tab.type,
				versions: versions,
				recommendedVersion: versions[0],
				alternateVersions: []
			});
			return;
		}

		// Sort by quality score (highest first)
		const sortedVersions = [...versions].sort((a, b) => b.qualityScore - a.qualityScore);

		const recommended = sortedVersions[0];
		const alternates = sortedVersions.slice(1);

		result.set(groupKey, {
			baseTitle: normalizeTitle(versions[0].title),
			artist: versions[0].artist,
			type: versions[0].type,
			versions: sortedVersions,
			recommendedVersion: recommended,
			alternateVersions: alternates
		});
	});

	return result;
}

/**
 * Detects if a search result has multiple versions of the same song
 *
 * @param tabs Array of tabs from search
 * @returns true if multiple versions detected
 */
export function hasMultipleVersions(tabs: TabInfo[]): boolean {
	const groups = groupTabVersions(tabs);

	// Check if any group has more than one version
	for (const group of groups.values()) {
		if (group.versions.length > 1) {
			return true;
		}
	}

	return false;
}

/**
 * Gets the recommended tab for a specific song from a list of tabs
 * If there's only one version or no versions, returns it directly
 * If there are multiple versions, returns the highest quality one
 *
 * @param tabs Array of tabs (should all be versions of the same song)
 * @returns The recommended tab
 */
export function getRecommendedTab(tabs: TabInfo[]): TabInfo {
	if (tabs.length === 0) {
		throw new Error('No tabs provided');
	}

	if (tabs.length === 1) {
		return tabs[0];
	}

	// Calculate quality scores and return highest
	const enhanced = tabs.map((tab) => ({
		...tab,
		qualityScore: calculateQualityScore(tab.rating, tab.votes)
	}));

	enhanced.sort((a, b) => b.qualityScore - a.qualityScore);

	return enhanced[0];
}
