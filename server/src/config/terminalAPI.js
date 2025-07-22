const axios = require('axios');
require('dotenv').config();

const base = process.env.TERMINAL_API_URL + '/v1';

// Terminal Africa axios client
const terminalAPI = axios.create({
  baseURL: base,
  headers: {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

terminalAPI.v2 = axios.create({
  baseURL: base.replace('/v1', '/v2'),
  headers: {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

module.exports = terminalAPI; 