const Country = require('country-state-city').Country;
const State = require('country-state-city').State;
const City = require('country-state-city').City;

// Get all countries
exports.getCountries = async (req, res) => {
  try {
    const countries = Country.getAllCountries().map(country => ({
      name: country.name,
      isoCode: country.isoCode,
      phoneCode: country.phonecode,
      flag: country.flag
    }));

    res.json({
      status: true,
      message: 'Countries fetched successfully',
      data: countries
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
};

// Get states by country code
exports.getStates = async (req, res) => {
  try {
    const { countryCode } = req.params;

    if (!countryCode) {
      return res.status(400).json({
        status: false,
        message: 'Country code is required'
      });
    }

    const states = State.getStatesOfCountry(countryCode).map(state => ({
      name: state.name,
      isoCode: state.isoCode,
      countryCode: state.countryCode
    }));

    res.json({
      status: true,
      message: 'States fetched successfully',
      data: states
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
};

// Get cities by country code and state code
exports.getCities = async (req, res) => {
  try {
    const { countryCode, stateCode } = req.params;

    if (!countryCode || !stateCode) {
      return res.status(400).json({
        status: false,
        message: 'Country code and state code are required'
      });
    }

    const cities = City.getCitiesOfState(countryCode, stateCode).map(city => ({
      name: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode
    }));

    res.json({
      status: true,
      message: 'Cities fetched successfully',
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
};
