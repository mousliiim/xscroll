import { identity, isPostId, postText } from './model.js';

export function extractReplies(json, tweetId, knownReplies) {
  const instructions = json?.data?.threaded_conversation_with_injections_v2?.instructions;
  if (!Array.isArray(instructions)) return null;

  const candidates = new Map();
  let cursor;
  function readItem(item) {
    const result = item?.tweet_results?.result;
    const tweet = result?.tweet || result;
    const legacy = tweet?.legacy;
    const id = tweet?.rest_id || legacy?.id_str;
    const parent = legacy?.in_reply_to_status_id_str;
    if (isPostId(id) && id !== tweetId && isPostId(parent)) candidates.set(id, { tweet, parent });
  }

  for (const instruction of instructions) {
    for (const entry of instruction.entries || (instruction.entry ? [instruction.entry] : [])) {
      const content = entry.content;
      if (content?.cursorType === 'Bottom' && typeof content.value === 'string') cursor = content.value;
      readItem(content?.itemContent);
      for (const { item } of content?.items || []) readItem(item?.itemContent);
    }
    for (const { item } of instruction.moduleItems || []) readItem(item?.itemContent);
  }

  function isReply({ tweet, parent }) {
    if (tweet.legacy.conversation_id_str === tweetId) return true;
    const visited = new Set();
    while (parent && !visited.has(parent)) {
      if (parent === tweetId || knownReplies?.has(parent)) return true;
      visited.add(parent);
      parent = candidates.get(parent)?.parent;
    }
    return false;
  }

  const replies = [];
  for (const [id, candidate] of candidates) {
    if (!isReply(candidate)) continue;
    const { tweet, parent } = candidate;
    const legacy = tweet.legacy;
    replies.push({
      id, nested: parent !== tweetId, ...identity(tweet),
      text: postText(tweet.note_tweet?.note_tweet_results?.result?.text ?? legacy.full_text),
      date: typeof legacy.created_at === 'string' ? legacy.created_at : '',
    });
  }
  return { replies, cursor };
}
