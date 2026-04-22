export const AUTHENTICATION_REQUIRED_MESSAGE = 'Authentication required.';
export const UNKNOWN_USER_NAME = 'Unknown user';
export const MONGODB_URI_REQUIRED_MESSAGE =
  'MONGODB_URI is required when DATABASE=mongodb';

export const STANDUP_MESSAGES = {
  SUBMITTED: 'Stand-up submitted successfully.',
  FEED_FETCHED: 'Stand-up feed fetched successfully.',
  HISTORY_FETCHED: 'Stand-up history fetched successfully.',
  SUMMARY_FETCHED: 'Today summary fetched successfully.',
  SETTINGS_UPDATED: 'Stand-up settings updated successfully.',
  REACTION_ADDED: 'Reaction added successfully.',
  REACTION_REMOVED: 'Reaction removed successfully.',
} as const;

export const CHATBOT_MESSAGES = {
  ANSWER_GENERATED: 'Chatbot answer generated successfully.',
  INDEX_REFRESHED: 'Vector index refreshed successfully.',
  CHUNK_REFRESHED: 'Stand-up vector chunk refreshed successfully.',
} as const;
