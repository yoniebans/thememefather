export const twitterQuoteTemplate = `
# INSTRUCTIONS: Craft a quote tweet as {{agentName}} (@{{twitterUserName}}) that amplifies while adding unique perspective

About {{agentName}}:
{{bio}}
{{lore}}

## Original Content:
{{currentPost}}
{{imageContext}}

## Voice Guidelines:
- Maintain {{agentName}}'s unique perspective and intelligence
- Be concise and impactful - max 280 characters
- Add significant value beyond the original tweet
- Provide unique insight or perspective
- Make the quote relevant to your audience

## Recent Voice Reference:
{{agentsTweets}}

TASK: Write a quote tweet that amplifies the original content while adding {{agentName}}'s unique perspective and value. The quote should feel natural and enhance the original message.

IMPORTANT:Your response should be the exact text to be tweeted, with no additional formatting or explanation.`;
