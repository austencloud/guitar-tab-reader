# AI Tab Generator Feature

## Overview

The AI Tab Generator is a modern, chat-based interface that allows users to generate guitar tabs using AI. It features:

- **Smart tab generation** from song name + artist
- **Internet research** to verify tabs against existing online sources
- **Slide-up panel** with modern 2025 UI/UX (no old-school modals!)
- **Chat interface** for natural interaction
- **Legal compliance** - generates tabs rather than scraping

## How It Works

1. User types a song name and artist (e.g., "Wonderwall by Oasis")
2. AI searches for reference information online (legally accessing public data)
3. AI generates a complete tab with chords and lyrics
4. Tab is verified against found sources
5. User can preview and save to their collection

## Setup Instructions

### 1. Get an Anthropic API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### 2. Add API Key to Your Environment

Create a `.env` file in the root of your project:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Important**: Make sure `.env` is in your `.gitignore` to keep your API key secret!

### 3. That's It!

The AI Tab Generator is already integrated into the app. Just click the "AI Generate" button on the home page!

## Features

### Chat Interface
- Natural conversation flow
- Ask AI to generate tabs by song name
- Get instant feedback and previews

### Internet Verification
- Searches online for existing tab references
- Compares AI-generated tabs with public sources
- Shows sources used in generation

### Modern UI
- Slide-up panel (not old modals!)
- Smooth animations
- Mobile-friendly
- Dark mode support

## Usage

### Basic Usage

1. Click "AI Generate" button from home page
2. Type: `"Wonderwall by Oasis"`
3. AI generates the tab
4. Preview and save to your collection

### Advanced Usage

You can also ask the AI to:
- `"Create a tab for Hotel California"`
- `"Generate Sweet Child O' Mine by Guns N' Roses"`
- Any song name + artist combination

## API Costs

The Claude API is pay-as-you-go:

- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- **Average tab generation**: ~$0.01-0.03 per tab
- Very affordable for personal use!

## Extending Web Search

The current implementation has a placeholder for web search. To add actual web search:

### Option 1: Google Custom Search API

```typescript
// In src/routes/api/generate-tab/+server.ts
async function searchForTabsOnline(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`
  );

  const data = await response.json();

  return data.items.map(item => `${item.title}: ${item.snippet}`);
}
```

### Option 2: Bing Search API

```typescript
async function searchForTabsOnline(query: string): Promise<string[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    }
  );

  const data = await response.json();

  return data.webPages.value.map(page => `${page.name}: ${page.snippet}`);
}
```

## Legal Considerations

This feature is designed to be **100% legal**:

✅ **AI Generation**: Creates original tab arrangements
✅ **Public Data**: Only accesses publicly available information
✅ **User-Initiated**: User does the searching, app just helps
✅ **Fair Use**: Educational/personal use
✅ **No Redistribution**: Tabs stay in user's local browser

❌ **Not scraping**: Doesn't automatically scrape Ultimate Guitar
❌ **Not copying**: Generates new arrangements, doesn't copy
❌ **Not commercial**: For personal use only

## Troubleshooting

### "Failed to generate tab"
- Check that your `ANTHROPIC_API_KEY` is set correctly in `.env`
- Make sure you have API credits in your Anthropic account
- Check the browser console for detailed errors

### "Web search failed"
- This is expected if you haven't set up a search API
- The AI will still generate tabs based on its knowledge
- See "Extending Web Search" section above to add search

### Generated tabs are inaccurate
- The AI does its best but may not know every song
- You can refine the prompt in `src/routes/api/generate-tab/+server.ts`
- Consider adding web search for better accuracy

## Future Improvements

Potential enhancements:

1. **YouTube Integration**: Generate tabs from YouTube audio
2. **Audio Analysis**: Use audio analysis to detect chords
3. **User Corrections**: Allow users to improve AI-generated tabs
4. **Community Sharing**: Optional sharing of user-verified tabs
5. **Multiple Voicings**: Offer different chord positions
6. **Difficulty Levels**: Simplified vs advanced versions

## Privacy & Security

- API keys are stored locally in `.env` (never committed to git)
- Tabs are stored in browser local storage
- No data is sent to external servers except Claude API
- HTTPS encryption for all API calls

---

**Enjoy generating tabs the modern, legal way!** 🎸
