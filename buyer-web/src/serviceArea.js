import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from './api';
export const normalizeState = state => String(state || '').trim().replace(/\s+/g,' ').replace(/\s+state$/i,'').trim().toLowerCase();
export const allowsState = (config,state) => !!config?.states?.some(s => normalizeState(s) === normalizeState(state));
export function useServiceArea() {
  const [config,setConfig] = useState(null),[error,setError] = useState('');
  useEffect(()=>{let live=true;axios.get(`${API}/api/v2/watch/config`).then(r=>{if(live)setConfig(r.data.serviceArea)}).catch(()=>{if(live)setError('Couldn’t load delivery areas. Please try again.');});return()=>{live=false}},[]);
  return { config,error };
}
