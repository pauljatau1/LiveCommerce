import {useEffect,useId,useRef,useState} from 'react';
import {allowedPlace,loadGoogleMaps,locationBias,mapPlace,PLACE_FIELDS} from './googlePlaces';
import './GoogleAddress.css';
export default function GoogleAddress({config,value,onChange,onNotify,needContact=false,initialNotifyEmail='',children,mapsKey=import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}) {
  const id=useId(),[status,setStatus]=useState(mapsKey?'loading':'fallback'),[query,setQuery]=useState(''),[suggestions,setSuggestions]=useState([]),[error,setError]=useState(''),[outside,setOutside]=useState(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[editing,setEditing]=useState(!value.addressLine1);
  const [notifyEmail,setNotifyEmail]=useState(initialNotifyEmail);
  const sdk=useRef(null),token=useRef(null),sequence=useRef(0),active=useRef(true),[highlight,setHighlight]=useState(0);
  useEffect(()=>{active.current=true;if(!mapsKey){setStatus('fallback');return()=>{active.current=false;};}
    const failed=()=>{if(active.current){setError('Address search couldn’t load. Choose your area below.');setStatus('fallback');}};window.addEventListener('commerce:maps-error',failed);
    loadGoogleMaps(mapsKey).then(async maps=>{const places=await maps.importLibrary('places');if(active.current){sdk.current={maps,places};token.current=new places.AutocompleteSessionToken();setStatus('ready');}}).catch(()=>{if(active.current){setError('Address search couldn’t load. Choose your area below.');setStatus('fallback');}});
    return()=>{active.current=false;sequence.current++;window.removeEventListener('commerce:maps-error',failed);};
  },[mapsKey]);
  useEffect(()=>{if(status!=='ready'||query.trim().length<3||!editing){setSuggestions([]);return undefined;}
    const serial=++sequence.current;const timer=setTimeout(async()=>{try{
      const result=await sdk.current.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:query,includedRegionCodes:['ng'],sessionToken:token.current,...(locationBias(config)?{locationBias:locationBias(config)}:{})});
      if(active.current&&serial===sequence.current){setSuggestions(result.suggestions.filter(s=>s.placePrediction));setHighlight(0);}
    }catch{if(active.current&&serial===sequence.current){setError('Address search isn’t available right now. Choose your area below.');setStatus('fallback');}}},300);
    return()=>{clearTimeout(timer);sequence.current++;};
  },[query,status,editing,config]);
  useEffect(()=>{if(status==='fallback'&&config?.states?.length===1&&!allowedPlace(config,value.state))onChange({state:config.states[0],city:'',lga:'',addressLine1:query.trim() || value.addressLine1 || '',latitude:null,longitude:null,addressSource:'manual',formattedAddress:''});},[status,config,value.state,onChange]);
  useEffect(()=>{if(status === 'fallback' && query.trim()) onChange({addressLine1:query.trim(),addressSource:'manual',formattedAddress:'',latitude:null,longitude:null});},[status,query]);
  const [fromLocation,setFromLocation]=useState(false);
  const apply=(place,currentLocation=false)=>{
    if(!config?.states?.length){setError('Delivery areas are still loading. Please try again.');return;}
    const address=mapPlace(place);
    if(address.country.toUpperCase()!=='NG'){setError('Choose an address in Nigeria.');return;}
    if(!allowedPlace(config,address.state)){setSuggestions([]);setNotice('');setOutside(address.state);onChange({...address,addressLine1:''});return;}
    if(!address.addressLine1||!address.city||!Number.isFinite(address.latitude)||!Number.isFinite(address.longitude)){setError('Google didn’t return a complete address. Choose your area below.');setStatus('fallback');return;}
    setFromLocation(currentLocation);setOutside(null);onChange(address);setSuggestions([]);setEditing(false);setError('');
  };
  const pick=async suggestion=>{setBusy(true);setError('');sequence.current++;try{
    const place=suggestion.placePrediction.toPlace();await place.fetchFields({fields:PLACE_FIELDS});if(active.current)apply(place);
  }catch{if(active.current){setError('We couldn’t use that address. Choose your area below.');setStatus('fallback');}}
  finally{if(active.current){setBusy(false);token.current=new sdk.current.places.AutocompleteSessionToken();}}};
  const locate=()=>{
    setError('');setNotice('Finding your current location…');
    if(!navigator.geolocation){setError('This browser can’t share your location. Type your address instead.');setNotice('');return;}
    setBusy(true);navigator.geolocation.getCurrentPosition(async position=>{try{
      const {Geocoder}=await sdk.current.maps.importLibrary('geocoding');
      const result=await new Geocoder().geocode({location:{lat:position.coords.latitude,lng:position.coords.longitude},region:'ng'});
      if(active.current){if(!result.results?.length)throw new Error('empty');apply(result.results[0],true);setNotice('');}
    }catch{if(active.current)setError('We couldn’t find an address at your location. Type your address instead.');}
    finally{if(active.current)setBusy(false);}},failure=>{if(active.current){setBusy(false);setNotice('');setError(failure.code===1?'Location permission was denied. Type your address instead.':'We couldn’t get your location. Type your address instead.');}},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  };
  if(status==='fallback')return <>{error&&<p className="hint" role="status">{error}</p>}{children}</>;
  return <section className="ga-address" aria-label="Find your address">
    {status==='loading'?<p className="hint" role="status">Loading address search…</p>:<>
      {!editing&&value.addressLine1?<div className="ga-selection"><div className="ga-picked"><span>{value.formattedAddress || [value.addressLine1,value.city,value.state].filter(Boolean).join(', ')}</span><button type="button" className="link" onClick={()=>{setEditing(true);setQuery('');setNotice('');onChange({addressLine1:'',city:'',lga:'',latitude:null,longitude:null,addressSource:'manual',formattedAddress:''});}}>Change</button></div>{fromLocation&&<p className="hint ga-location-note" role="status">Address found from your current location</p>}</div>:<>
        <label className="lab" htmlFor={`places-${id}`}>Start typing your street or building</label>
        <input id={`places-${id}`} className="in" placeholder="Start typing your street or building" value={query} disabled={busy} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length>0} aria-controls={`places-list-${id}`} aria-activedescendant={suggestions.length?`places-option-${id}-${highlight}`:undefined} onChange={e=>{setQuery(e.target.value);setError('');setOutside(null);}} onKeyDown={e=>{if(e.key==='ArrowDown'&&suggestions.length){e.preventDefault();setHighlight(i=>(i+1)%suggestions.length);}if(e.key==='ArrowUp'&&suggestions.length){e.preventDefault();setHighlight(i=>(i+suggestions.length-1)%suggestions.length);}if(e.key==='Enter'){e.preventDefault();if(suggestions[highlight])pick(suggestions[highlight]);}if(e.key==='Escape'&&suggestions.length){e.preventDefault();e.stopPropagation();setSuggestions([]);}}} />
        {!!suggestions.length&&<div id={`places-list-${id}`} className="ga-suggestions" role="listbox">{suggestions.map((suggestion,i)=><button id={`places-option-${id}-${i}`} key={suggestion.placePrediction.placeId || i} type="button" role="option" aria-selected={i===highlight} disabled={busy} onClick={()=>pick(suggestion)}>{suggestion.placePrediction.text.toString()}</button>)}</div>}
      </>}
      <button type="button" className="btn2" disabled={busy} onClick={locate}>{busy?'Finding address…':'Use my current location'}</button>
      <button type="button" className="link" disabled={busy} onClick={()=>{sequence.current++;setStatus('fallback');}}>Choose area manually</button>
    </>}
    {outside&&<div className="ga-outside" role="alert"><strong>Delivery is {config?.states?.join(' and ')}-only for now</strong><p>You can keep watching and chatting. Add an address in our service area, or we’ll tell you when we deliver to {outside}.</p><>{needContact&&<label className="lab">Email for updates<input className="in" type="email" value={notifyEmail} onChange={e=>setNotifyEmail(e.target.value)}/></label>}<button type="button" className="btn2" disabled={busy} onClick={async()=>{setBusy(true);try{if(!onNotify)throw new Error();if(needContact&&!/^\S+@\S+\.\S+$/.test(notifyEmail))throw {response:{data:{message:"Add your email so we can notify you."}}};await onNotify(outside,notifyEmail);setNotice('We’ll tell you when delivery opens in your state.');}catch(e){setError(e?.response?.data?.message || 'Couldn’t save your request. Please try again.');}finally{if(active.current)setBusy(false);}}}>Notify me</button></></div>}
    {error&&<p className="err" role="alert">{error}</p>}{notice&&<p className="hint" role="status">{notice}</p>}
  </section>;
}
