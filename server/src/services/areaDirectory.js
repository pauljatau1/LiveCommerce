const lagosAreas = require('../data/lagosAreas.json');
const {normalizeState, requireState} = require('./serviceArea');
const BadRequestException = require('../utils/errors/BadRequestException');
const popular = ['Lekki','Ajah','Victoria Island','Ikoyi','Yaba','Surulere','Ikeja','Gbagada','Magodo','Ogba','Maryland','Festac','Ikorodu','Ikotun','Egbeda'];
const island = new Set(['Eti-Osa','Ibeju-Lekki','Lagos Island','Epe']);
const normalizeArea = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function areaOptions(state) {
  if (normalizeState(state) !== 'lagos') return [];
  const rows = new Map();
  for (const [lga, names] of Object.entries(lagosAreas)) {
    for (const value of new Set([lga, ...names])) {
      const name = normalizeArea(value) === 'vi' ? 'Victoria Island' : value;
      const key = `${name}|${lga}`;
      rows.set(key, {name, lga, group: island.has(lga) ? 'Island' : 'Mainland',
        aliases: name === 'Victoria Island' ? ['VI','V.I.'] : [],
        popularRank: popular.indexOf(name),
      });
    }
  }
  return [...rows.values()];
}
function findArea({state, city, lga} = {}) {
  const needle = normalizeArea(city);
  if (!needle) return null;
  return areaOptions(state).find(row => [row.name, ...row.aliases].some(name => normalizeArea(name) === needle)
    && (!lga || normalizeArea(row.lga) === normalizeArea(lga))) || null;
}
function validateArea(address) {
  if (!address?.city || !address?.state) throw Object.assign(new BadRequestException('Choose your area from the list.'), {status:400, code:'invalid_area'});
  requireState(address.state);
  if(address.phoneNumber !== undefined && require('../utils/phone').phoneProblem(address.phoneNumber))throw Object.assign(new BadRequestException(require('../utils/phone').PHONE_ERROR),{status:400});
  const row = findArea(address);
  if (address.addressSource === 'google') {
    const {latitude, longitude} = address;
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180 || !String(address.addressLine1 || '').trim()) {
      throw Object.assign(new BadRequestException('Choose your address again so we can find it on the map.'), {status:400});
    }
    return {city:row?.name || String(address.city).trim(), lga:row?.lga || String(address.lga || '').trim(), latitude, longitude, addressSource:'google', formattedAddress:String(address.formattedAddress || '').slice(0,500)};
  }
  if (!row) throw Object.assign(new BadRequestException('Choose your area from the list.'), {status:400, code:'invalid_area'});
  return {city:row.name, lga:row.lga, ...(address.addressSource || address.latitude != null || address.longitude != null ? {latitude:null,longitude:null,addressSource:'manual',formattedAddress:''} : {})};
}
// No strict validation here: older saved addresses must remain usable for quotes/orders.
function deliveryAddress(address = {}) {
  const known = findArea(address);
  const state = normalizeState(address.state) === 'lagos' ? 'Lagos' : address.state;
  return [address.addressLine1, address.addressLine2 || address.landmark, address.city,
    address.lga || known?.lga, state, 'Nigeria'].map(value => String(value || '').trim()).filter(Boolean).join(', ');
}
module.exports = {areaOptions, normalizeArea, findArea, validateArea, deliveryAddress};
