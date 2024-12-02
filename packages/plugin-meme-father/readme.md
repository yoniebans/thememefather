# Meme Father Plugin

## Overview

This plugin manages the creation and tracking of memes within the AI system. It provides actions for the AI to identify and store meme-worthy content from conversations.

## Architecture

The plugin uses the core MemoryManager system to store meme entries. Each meme is stored as a memory with specific content structure including:

-   Text content (the meme idea)
-   Vote count
-   Status (pending/launched)
-   Creation timestamp

## Current Actions

-   CREATE_MEME: Stores a meme-worthy conversation or idea
-   VOTE_MEME: Updates the vote count for a meme (TODO)
-   LAUNCH_MEME: Marks a meme as launched for the week (TODO)

## Integration

The plugin integrates with the frontend leaderboard to display top memes and their current status.

## TODO:

1. Add voting mechanism
2. Implement weekly meme launch selection
3. Add meme categorization
4. Add image generation integration for visual memes
