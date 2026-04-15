// Nhost public endpoints — no secrets here
// Replace YOUR_NHOST_DOMAIN with your actual domain after deploying Nhost

const NHOST_DOMAIN = 'nhost.weebx.duckdns.org';

const CHAT_PROXY_URL     = `https://${NHOST_DOMAIN}/v1/functions/chat-proxy`;
const SAVE_LEAD_FORM_URL = `https://${NHOST_DOMAIN}/v1/functions/save-lead-form`;
const NHOST_GRAPHQL_URL  = `https://${NHOST_DOMAIN}/v1/graphql`;
