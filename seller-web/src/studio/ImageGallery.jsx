import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
const srcOf = image => typeof image==='string'?image:image?.url || image?.data || '';
export default function ImageGallery({images=[],alt='Product photo',size,height=320}) {
  const photos=images.map(srcOf).filter(Boolean),[index,setIndex]=useState(0),[open,setOpen]=useState(false);
  const start=useRef(null),dragged=useRef(false),closeRef=useRef(null),trigger=useRef(null),modalRef=useRef(null);
  const current=Math.min(index,Math.max(0,photos.length-1));
  const step=by=>setIndex(i=>(i+by+photos.length)%photos.length);
  const down=e=>{start.current={x:e.clientX,y:e.clientY};dragged.current=false;};
  const up=e=>{const p=start.current;if(!p)return;const x=e.clientX-p.x,y=e.clientY-p.y;dragged.current=Math.max(Math.abs(x),Math.abs(y))>30;if(Math.abs(x)>40&&Math.abs(x)>Math.abs(y))step(x<0?1:-1);else if(open&&y>70)setOpen(false);start.current=null;};
  useEffect(()=>{if(!open)return;const before=document.activeElement,overflow=document.body.style.overflow,root=document.getElementById('root'),inert=root?.inert;document.body.style.overflow='hidden';if(root)root.inert=true;closeRef.current?.focus();const key=e=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.key==='Tab'){const buttons=[...modalRef.current.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;if(root)root.inert=inert;document.removeEventListener('keydown',key);before?.focus?.();};},[open,photos.length]);
  if(!photos.length)return <span className="sk" style={{display:'block',width:size || '100%',height:size || height,borderRadius:size?14:0}}/>;
  return <><div className={`photo-gallery${size?' photo-thumb':''}`} style={size?{width:size,height:size,flex:'none'}:{height}} onPointerDown={down} onPointerUp={up}>
    <button ref={trigger} className="photo-open" type="button" aria-label={`Open photos of ${alt}`} onClick={()=>{if(!dragged.current)setOpen(true);}}><img src={photos[current]} alt={alt} draggable={false}/></button>
    {!size&&photos.length>1&&<button className="pill photo-counter" type="button" aria-label="Next photo" onClick={()=>step(1)}>{current+1} / {photos.length} ›</button>}
  </div>{open&&createPortal(<div ref={modalRef} className="photo-full studio-app" role="dialog" aria-modal="true" aria-label={`${alt} photos`} onPointerDown={down} onPointerUp={up}>
    <button ref={closeRef} type="button" className="ib photo-close" aria-label="Close photos" onClick={()=>setOpen(false)}>✕</button><img src={photos[current]} alt={`${alt}, photo ${current+1}`} draggable={false}/>
    <div className="photo-controls"><button className="ib" aria-label="Previous photo" onClick={()=>step(-1)}>‹</button><span className="pill" aria-live="polite">{current+1} / {photos.length}</span><button className="ib" aria-label="Next photo" onClick={()=>step(1)}>›</button></div>
  </div>,document.body)}</>;
}
