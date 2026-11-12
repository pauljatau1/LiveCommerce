export const googleAddressEnabled = value => value === 'google';
export const PLACE_FIELDS = ['formattedAddress','addressComponents','location'];
export const normalState = value => String(value || '').trim().replace(/\s+state$/i,'').trim().toLowerCase();
export const allowedPlace = (config,state) => Boolean(config?.states?.some(value=>normalState(value)===normalState(state)));
export function mapPlace(place) {
  const components=place.addressComponents || place.address_components || [];
  const part=type=>{const value=components.find(item=>item.types?.includes(type));return value?.longText || value?.long_name || '';};
  const street=[part('street_number'),part('route')].filter(Boolean).join(' ');
  const building=part('premise');
  const formattedAddress=place.formattedAddress || place.formatted_address || '';
  const location=place.location || place.geometry?.location;
  const latitude=typeof location?.lat==='function'?location.lat():location?.lat;
  const longitude=typeof location?.lng==='function'?location.lng():location?.lng;
  return {addressLine1:[building,street].filter(Boolean).join(', ') || formattedAddress.split(',')[0],
    city:part('sublocality_level_1') || part('sublocality') || part('neighborhood') || part('locality'),
    lga:part('administrative_area_level_2').replace(/\s+(local government area|lga)$/i,''),
    state:part('administrative_area_level_1').replace(/\s+state$/i,''),
    country:components.find(item=>item.types?.includes('country'))?.shortText || components.find(item=>item.types?.includes('country'))?.short_name || '',
    latitude,longitude,formattedAddress,addressSource:'google'};
}
export function locationBias(config) {
  const bounds=(config?.states || []).map(state=>config?.bounds?.[state]).filter(Boolean);
  if (!bounds.length) return undefined;
  return {north:Math.max(...bounds.map(b=>b.north)),south:Math.min(...bounds.map(b=>b.south)),east:Math.max(...bounds.map(b=>b.east)),west:Math.min(...bounds.map(b=>b.west))};
}
let loading;
export function loadGoogleMaps(key) {
  if (!key) return Promise.reject(new Error('Google address search is not set up.'));
  if (globalThis.google?.maps?.importLibrary) return Promise.resolve(globalThis.google.maps);
  if (loading) return loading;
  loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let timer;
    const fail=()=>{clearTimeout(timer);script.remove();delete window.__commerceMapsReady;loading=undefined;reject(new Error('Google address search could not load.'));};
    window.__commerceMapsReady=()=>{clearTimeout(timer);delete window.__commerceMapsReady;resolve(window.google.maps);};
    window.gm_authFailure=()=>{fail();window.dispatchEvent(new Event('commerce:maps-error'));};
    script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=places&callback=__commerceMapsReady`;
    script.async=true;script.onerror=fail;timer=setTimeout(fail,12000);document.head.appendChild(script);
  });
  return loading;
}
