import {Sheet} from './ui';
// Keep the legacy browser confirmation available for rollback only.
export const LEGACY_BROWSER_CONFIRM=import.meta.env.VITE_LEGACY_BROWSER_CONFIRM==='true';
export default function ConfirmSheet({title='Remove this photo?',onKeep,onRemove}) {
 return <Sheet label={title} onClose={onKeep}><h2 className="f" style={{fontSize:'var(--t-h2)'}}>{title}</h2><div style={{display:'flex',gap:12}}><button type="button" className="btn3" style={{flex:1}} onClick={onKeep}>Keep</button><button type="button" className="btn btn-d" style={{flex:1}} onClick={onRemove}>Remove</button></div></Sheet>;
}
