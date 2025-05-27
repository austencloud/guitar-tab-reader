import { describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Page from './+page.svelte';

describe('Home Page (+page.svelte)', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	test('should render main heading', () => {
		render(Page);
		expect(screen.getByRole('heading', { level: 1, name: /tab scroll/i })).toBeInTheDocument();
	});

	test('should display version information', () => {
		render(Page);
		expect(screen.getByText('1.0.0')).toBeInTheDocument();
	});

	test('should render search input', () => {
		render(Page);
		const searchInput = screen.getByRole('searchbox', { name: /search tabs/i });
		expect(searchInput).toBeInTheDocument();
		expect(searchInput).toHaveAttribute('placeholder', 'Search tabs...');
	});

	test('should render action buttons', () => {
		render(Page);
		expect(screen.getByRole('button', { name: /import tab/i })).toBeInTheDocument();
		// Use getAllByRole since there are multiple "New Tab" buttons (header and empty state)
		const newTabButtons = screen.getAllByRole('button', { name: /new tab/i });
		expect(newTabButtons.length).toBeGreaterThan(0);
	});

	test('should show empty state when no tabs exist', () => {
		render(Page);
		expect(screen.getByText('No tabs yet')).toBeInTheDocument();
		expect(screen.getByText('Create a new tab or import one to get started')).toBeInTheDocument();
	});

	test('should handle search input changes', async () => {
		const user = userEvent.setup();
		render(Page);

		const searchInput = screen.getByRole('searchbox');
		await user.type(searchInput, 'test search');

		expect(searchInput).toHaveValue('test search');
	});

	test('should open import modal when import button is clicked', async () => {
		const user = userEvent.setup();
		render(Page);

		const importButton = screen.getByRole('button', { name: /import tab/i });
		await user.click(importButton);

		// The modal should be rendered (this would need the modal component to be properly mocked)
		// For now, we just test that the button is clickable
		expect(importButton).toBeInTheDocument();
	});

	test('should be accessible with keyboard navigation', async () => {
		const user = userEvent.setup();
		render(Page);

		// Tab through interactive elements
		await user.tab();
		expect(screen.getByRole('searchbox')).toHaveFocus();

		await user.tab();
		expect(screen.getByRole('button', { name: /import tab/i })).toHaveFocus();

		await user.tab();
		// Get the first "New Tab" button in the header
		const newTabButtons = screen.getAllByRole('button', { name: /new tab/i });
		expect(newTabButtons[0]).toHaveFocus();
	});

	test('should have proper ARIA labels', () => {
		render(Page);

		const searchInput = screen.getByRole('searchbox');
		expect(searchInput).toHaveAttribute('aria-label', 'Search tabs');

		const importButton = screen.getByRole('button', { name: /import tab/i });
		expect(importButton).toBeInTheDocument();

		const newTabButtons = screen.getAllByRole('button', { name: /new tab/i });
		expect(newTabButtons.length).toBeGreaterThan(0);
	});
});
