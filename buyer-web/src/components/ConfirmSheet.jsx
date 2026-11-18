import {Sheet} from './ui';
export const LEGACY_BROWSER_CONFIRM=import.meta.env.VITE_LEGACY_BROWSER_CONFIRM==='true';
export default function ConfirmSheet({title,onKeep,onRemove}) {
 return <Sheet title={title} onClose={onKeep}><div style={{display:'flex',gap:12}}><button type="button" className="btn3" style={{flex:1}} onClick={onKeep}>Keep</button><button type="button" className="btn btn-d" style={{flex:1}} onClick={onRemove}>Remove</button></div></Sheet>;
}
