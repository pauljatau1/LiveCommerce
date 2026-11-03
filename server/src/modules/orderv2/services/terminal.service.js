const terminalAPI = require('../../../config/terminalAPI');

/**
 * Get states for a country
 * @returns {Promise<any>}
 */
const getStates = async () => {
  try {
    const response = await terminalAPI.get('/states?country_code=NG');
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};

/**
 * Get cities for a state
 * @param {string} stateCode - The code of the state
 * @returns {Promise<any>}
 */
const getCities = async (stateCode) => {
  try {
    const response = await terminalAPI.get(`/cities?country_code=NG&state_code=${stateCode}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};

module.exports = {
  getStates,
  getCities,
};
