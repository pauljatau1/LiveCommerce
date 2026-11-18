// Memory belongs to this document only. local/sessionStorage can be cloned into
// another tab, so neither is an authority for ownership of a live camera.
const sessions=new Map();
export const hostSession=id=>sessions.get(String(id)) || null;
export const rememberHost=(id,value)=>sessions.set(String(id),value);
// Capture a local still before closing the camera. It never leaves the page.
export function captureHostFrame(){
 try{const video=document.querySelector('.lv-video video');if(!video?.videoWidth)return null;const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);return canvas.toDataURL('image/jpeg',0.7);}catch{return null;}
}
export function movedHost(id,details={}){sessions.delete(String(id));window.dispatchEvent(new CustomEvent('studio:host-moved',{detail:{streamId:String(id),frame:details.frame || captureHostFrame(),host:details.host}}));}
export const hostHeaders=id=>hostSession(id)?{'X-Host-Session-Id':hostSession(id)}:{};
