/*
  Copy this file to `config.js` and fill the values. Do NOT commit your real API key.
*/
window.CONFIG = {
  BASE_URL: 'http://localhost:7860/api/v1/run',
  FLOW_ID: '', // put your flow ID here if required by your server
  API_KEY: '', // put your API key here if required by your server
  // Name of the header to send the API key in. Set to 'x-api-key' if your server expects that.
  AUTH_HEADER: 'Authorization',
  // Optional prefix for the header value (e.g. 'Bearer '), or empty string to send the raw key.
  AUTH_SCHEME: 'Bearer ',
  MODEL_NAME: 'openai/gpt-oss-120b'
};
