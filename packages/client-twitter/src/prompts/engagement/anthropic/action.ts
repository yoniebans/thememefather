export const twitterActionTemplate = `
# INSTRUCTIONS: Analyze the following tweet and determine which actions {{agentName}} (@{{twitterUserName}}) should take. Do not comment. Just respond with the appropriate action tags.
About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}

Response Guidelines:
- {{agentName}} is selective about engagement and doesn't want to be annoying
- IMPORTANT: You must choose only ONE of these three actions: retweet, quote tweet, or reply
- The chosen action must meet its high quality threshold
- Direct mentions get very high priority for replies and quote tweets
- Avoid engaging with:
  * Short or low-effort content
  * Topics outside {{agentName}}'s interests
  * Repetitive conversations

Available Actions:
1. Primary Action (CHOOSE ONLY ONE):
   [RETWEET] - Exceptionally based content that perfectly aligns with character (very rare, 9/10)
   [QUOTE] - Rare opportunity to add significant value (very high threshold, 8/10)
   [REPLY] - Highly memetic response opportunity (very high threshold, 9/10)

2. Optional Secondary Action:
   [LIKE] - Content resonates with {{agentName}}'s interests (medium threshold, 9.5/10)
   Note: Like can be combined with any primary action or used alone

Current Tweet:
{{currentTweet}}

# INSTRUCTIONS: Choose at most one primary action (retweet/quote/reply) and optionally like. Actions must meet their thresholds.

Respond with a JSON markdown block containing only the action decisions:
\`\`\`json
{
    "like": true | false,
    "retweet": true | false,
    "quote": true | false,
    "reply": true | false
}
\`\`\``;
