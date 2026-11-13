import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {areaGroups} from './areaPicker';
import './AreaPicker.css';

// Independent of native datalist support, including iOS browsers and nested checkout sheets.
export default function AreaPicker({id, value = '', lga = '', areas = [], onChange, disabled = false}) {
  const generated = useId(), dialog = useRef(null), trigger = useRef(null), search = useRef(null);
  const [open,setOpen] = useState(false), [query,setQuery] = useState('');
  const fieldId = id || `area-${generated}`;
  const close = () => setOpen(false);
  useEffect(()=>{
    if (!open) return undefined;
    const restore = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Keep popular choices visible on phones until the seller/buyer taps Search.
    const initial = window.matchMedia('(min-width:700px)').matches ? search.current : dialog.current?.querySelector('button');
    initial?.focus();
    const key = event => {
      if (event.key === 'Escape') {event.preventDefault();event.stopImmediatePropagation();setOpen(false);}
      if (event.key === 'Tab') {
        const items = [...dialog.current.querySelectorAll('button:not(:disabled),input')];
        if (event.shiftKey && document.activeElement === items[0]) {event.preventDefault();items.at(-1)?.focus();}
        else if (!event.shiftKey && document.activeElement === items.at(-1)) {event.preventDefault();items[0]?.focus();}
      }
    };
    // Capture Escape so closing the picker never also closes the address sheet below it.
    document.addEventListener('keydown',key,true);
    return ()=>{document.removeEventListener('keydown',key,true);document.body.style.overflow=overflow;restore?.focus?.();};
  },[open]);
  const groups = areaGroups(areas,query);
  return <>
    <button ref={trigger} id={fieldId} type="button" className="ap-field" aria-label={`Area: ${value || 'Choose your area'}`} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={()=>{setQuery('');setOpen(true);}}>
      <span className={value?'':'ap-muted'}>{value || 'Choose your area'}</span><span aria-hidden="true">⌄</span>
    </button>
    {open && createPortal(<div className="ap-layer">
      <div className="ap-backdrop" onClick={close} aria-hidden="true" />
      <section ref={dialog} className="ap-dialog" role="dialog" aria-modal="true" aria-labelledby={`${fieldId}-title`}>
        <div className="ap-grab" aria-hidden="true" />
        <header className="ap-head"><h2 id={`${fieldId}-title`}>Choose your area</h2><button type="button" className="ap-close" aria-label="Close area picker" onClick={close}>×</button></header>
        <div className="ap-search"><label className="ap-sr" htmlFor={`${fieldId}-search`}>Search area or LGA</label><input ref={search} id={`${fieldId}-search`} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search area or LGA" type="search" autoComplete="off" /></div>
        <div className="ap-results" aria-live="polite">
          {!areas.length && <p className="ap-empty">Areas aren’t available for this state yet. Please try again later.</p>}
          {!!areas.length && !groups.some(group=>group.areas.length) && <p className="ap-empty">No areas match. Try another area or LGA name.</p>}
          {groups.map(group=><section className={group.label==='Popular'?'ap-popular':''} key={group.label} aria-label={group.label}><h3 className="ap-group">{group.label==='Search results'?`${group.areas.length} ${group.areas.length===1?'result':'results'}`:group.label}</h3>{group.areas.map(area=><button type="button" className="ap-option" key={`${area.name}-${area.lga}`} aria-label={`${area.name}, ${area.lga}`} aria-pressed={value === area.name && (!lga || lga === area.lga)} onClick={()=>{onChange(area);close();}}><span>{area.name}{group.label!=='Popular'&&<small>{area.lga}</small>}</span>{value === area.name && (!lga || lga === area.lga) && <span className="ap-check" aria-hidden="true">✓</span>}</button>)}</section>)}
        </div>
        <p className="ap-help">Can't find your area? Pick the closest one. Your street address tells the courier the rest.</p>
      </section>
    </div>,document.body)}
  </>;
}
