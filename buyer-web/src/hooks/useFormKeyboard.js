// Non-live forms: hide unrelated sticky actions and keep the active field visible.
import {useEffect,useRef} from 'react';
import useKeyboardInset from './useKeyboardInset';
const editable=el=>el?.matches?.('textarea,select,[contenteditable="true"],input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=range])');
export default function useFormKeyboard(){
 const ref=useRef(null),keyboard=useKeyboardInset();
 useEffect(()=>{
  const node=ref.current;
  if(!node || /^\/studio\/live\//.test(location.pathname))return undefined;
  const scope=node.tagName==='HEADER' ? node.closest('.studio-app,.app') : node;
  if(!scope)return undefined;
  let frame;
  const update=()=>{
   const el=document.activeElement,focused=scope.contains(el)&&editable(el),composing=focused&&Boolean(el.closest('.composer'));
   scope.dataset.formEditing=String(Boolean(focused&&!composing));
   scope.dataset.formComposing=String(Boolean(composing));
   scope.dataset.formKeyboard=String(keyboard.bottom>0);
   scope.style.setProperty('--form-keyboard-bottom',`${keyboard.bottom}px`);
   scope.style.setProperty('--form-viewport-height',`${keyboard.height}px`);
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    if(!focused)return;
    const vv=window.visualViewport,limit=(vv ? vv.height+vv.offsetTop : innerHeight)-16;
    const delta=el.getBoundingClientRect().bottom-limit;
    if(delta<=0)return;
    let parent=el.parentElement;
    while(parent && parent!==document.body){if(/auto|scroll/.test(getComputedStyle(parent).overflowY)&&parent.scrollHeight>parent.clientHeight){parent.scrollBy({top:delta,behavior:'instant'});return;}parent=parent.parentElement;}
    window.scrollBy({top:delta,behavior:'instant'});
   });
  };
  const blur=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  document.addEventListener('focusin',update);document.addEventListener('focusout',blur);update();
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('focusin',update);document.removeEventListener('focusout',blur);delete scope.dataset.formEditing;delete scope.dataset.formComposing;delete scope.dataset.formKeyboard;scope.style.removeProperty('--form-keyboard-bottom');scope.style.removeProperty('--form-viewport-height');};
 },[keyboard.bottom,keyboard.height]);
 return ref;
}
