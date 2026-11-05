// Nigerian states and cities for address forms, served locally (no delivery
// provider call). Shape matches what the seller studio expects:
//   state: { name, isoCode, countryCode, latitude, longitude }
//   city:  { name, countryCode, stateCode, latitude, longitude }

const { State, City } = require('country-state-city');

// The package's Lagos list is thin; add LGAs and the areas sellers actually use.
const EXTRA_CITIES = {
  LA: [
    'Agege', 'Ajah', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Eti-Osa', 'Festac', 'Gbagada',
    'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikorodu', 'Ikoyi', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
    'Lekki', 'Magodo', 'Maryland', 'Mushin', 'Ogba', 'Ojo', 'Ojota', 'Oshodi-Isolo', 'Shomolu',
    'Surulere', 'Victoria Island', 'Yaba',
  ],
  FC: ['Asokoro', 'Garki', 'Gwagwalada', 'Gwarinpa', 'Jabi', 'Lugbe', 'Maitama', 'Wuse'],
};

const getStates = () => State.getStatesOfCountry('NG');

const getCities = (stateCode) => {
  const code = String(stateCode || '').toUpperCase();
  const state = State.getStateByCodeAndCountry(code, 'NG');
  if (!state) return [];
  const cities = City.getCitiesOfState('NG', code);
  const names = new Set(cities.map((c) => c.name.toLowerCase()));
  for (const name of EXTRA_CITIES[code] || []) {
    if (!names.has(name.toLowerCase())) {
      cities.push({ name, countryCode: 'NG', stateCode: code, latitude: state.latitude, longitude: state.longitude });
    }
  }
  return cities.sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = { getStates, getCities };
