import { Link } from 'react-router-dom';
import { APP_NAME } from '@/config/constants';
import './studio.css';
export function StudioLoader() { return <div className="studio-app"><div className="st-inner entry-screen" role="status" aria-label="Loading studio"><span className="f entry-wordmark">{APP_NAME}</span><span className="sk" style={{height:20,width:'65%'}} /><span className="sk" style={{height:96}} /><span className="hint">Loading your studio…</span></div></div>; }
export function StudioProblem({ title = 'We couldn’t find that page', text = 'The link may have changed. Your studio is still here.', reload = false }) {
 return <div className="studio-app"><main className="st-inner entry-screen"><span className="f entry-wordmark">{APP_NAME}</span><h1 className="h1">{title}</h1><p className="mut">{text}</p><Link className="btn" to="/studio">Go to studio</Link>{reload && <button className="btn2" onClick={()=>location.reload()}>Refresh page</button>}</main></div>;
}
