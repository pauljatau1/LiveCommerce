import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntercomVisibility } from '@/Hooks/useIntercomVisibility';
import { CLASSIC_DASHBOARD } from '@/config/featureFlags';
export default function Chrome() {
 const { pathname } = useLocation();
 const studio = !CLASSIC_DASHBOARD || pathname.startsWith('/studio');
 useIntercomVisibility(studio);
 useEffect(()=>{document.body.classList.toggle('studio-ui',studio);return()=>document.body.classList.remove('studio-ui');},[studio]);
 return null;
}
