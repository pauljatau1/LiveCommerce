import test from 'node:test';
import assert from 'node:assert/strict';
import {hostSession,rememberHost,movedHost,captureHostFrame} from './hostSession.js';
test('host ID stays per document; moving clears authority and includes the stopped-camera details',async()=>{
 const otherDocument=await import('./hostSession.js?other-document');
 rememberHost('show','secret');assert.equal(hostSession('show'),'secret');assert.equal(otherDocument.hostSession('show'),null);
 const previous=globalThis.window;globalThis.window=new EventTarget();let event;
 window.addEventListener('studio:host-moved',e=>event=e.detail);
 try{movedHost('show',{frame:'data:image/jpeg;base64,snapshot',host:{deviceName:'iPhone'}});assert.equal(hostSession('show'),null);assert.equal(event.frame,'data:image/jpeg;base64,snapshot');assert.equal(event.host.deviceName,'iPhone');assert.equal(captureHostFrame(),null);}finally{globalThis.window=previous;}
});
