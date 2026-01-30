require('dotenv').config();
const https = require('https');

const BASE_URL_V1 = process.env.TERMINAL_API_URL + '/v1';
const BASE_URL_V2 = process.env.TERMINAL_API_URL + '/v2';
const SECRET_KEY = process.env.TERMINAL_SECRET_KEY;

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT_MS = 15000;

// HTTPS Agent with connection pooling (keep-alive)
// This reuses TCP connections, saving 200-800ms per request on TLS handshake
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,  // Keep connections alive for 30 seconds
  maxSockets: 10,          // Max 10 concurrent connections to Terminal API
  maxFreeSockets: 5,       // Keep 5 idle connections ready
  timeout: 60000,          // Socket timeout 60 seconds
});

// Logging helper
const logRequest = (method, url, body) => {
  console.log(`[Terminal API] REQUEST: ${method} ${url}`);
  if (body) console.log('Request Data:', JSON.stringify(body, null, 2));
};

const logResponse = (method, url, duration, status) => {
  console.log(`[Terminal API] RESPONSE: ${method} ${url} | Duration: ${duration.toFixed(3)} seconds | Status: ${status}`);
};

const customFetch = async (baseUrl, endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const method = options.method || 'GET';
  const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;

  const headers = {
    'Authorization': `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',  // Explicitly request keep-alive
    ...(options.headers || {})
  };

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const config = {
    method,
    headers,
    agent: httpsAgent,  // Use connection pooling
    signal: controller.signal,  // Enable timeout via AbortController
    ...(options.body && { body: JSON.stringify(options.body) })
  };

  const startTime = Date.now();
  logRequest(method, url, options.body);

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);  // Clear timeout on success

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Attempt to parse JSON response
    let data = {};
    const text = await response.text();
    try {
      if (text) data = JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse response JSON', e);
    }

    logResponse(method, url, duration, response.status);

    if (!response.ok) {
      // Create an error object that mimics axios error structure
      const error = new Error(`Request failed with status ${response.status}`);
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: response.headers
      };
      error.config = { method, url, headers, data: options.body };
      throw error;
    }

    // Mimic axios response object
    return {
      data: data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: { method, url, headers, data: options.body },
      request: {} // Placeholder to avoid crashes if accessed
    };

  } catch (error) {
    clearTimeout(timeoutId);  // Always clear timeout

    // Handle timeout specifically
    if (error.name === 'AbortError') {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`[Terminal API] TIMEOUT: ${method} ${url} | Duration: ${duration.toFixed(3)} seconds | Timeout after ${timeoutMs}ms`);

      const timeoutError = new Error(`Terminal API request timed out after ${timeoutMs}ms`);
      timeoutError.code = 'ETIMEDOUT';
      timeoutError.isTimeout = true;
      throw timeoutError;
    }

    // If it's the error we already formatted, rethrow it
    if (error.response) throw error;

    // Network or other errors
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`[Terminal API] ERROR: ${method} ${url} | Duration: ${duration.toFixed(3)} seconds | Error: ${error.message}`);
    throw error;
  }
};

const createClient = (baseUrl) => ({
  get: (endpoint, config = {}) => customFetch(baseUrl, endpoint, { ...config, method: 'GET' }),
  post: (endpoint, data, config = {}) => customFetch(baseUrl, endpoint, { ...config, method: 'POST', body: data }),
  put: (endpoint, data, config = {}) => customFetch(baseUrl, endpoint, { ...config, method: 'PUT', body: data }),
  delete: (endpoint, config = {}) => customFetch(baseUrl, endpoint, { ...config, method: 'DELETE' }),
  patch: (endpoint, data, config = {}) => customFetch(baseUrl, endpoint, { ...config, method: 'PATCH', body: data }),
});

const terminalAPI = createClient(BASE_URL_V1);
terminalAPI.v2 = createClient(BASE_URL_V2);

// Export agent for monitoring/cleanup if needed
terminalAPI.agent = httpsAgent;

module.exports = terminalAPI;