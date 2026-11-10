import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acquireTracks, createTrackScope, releaseTrack } from './localMedia.js';
const deferred = () => { let resolve; let reject; const promise = new Promise((r,j)=>{resolve=r;reject=j});return {promise,resolve,reject}; };
const track = () => { const t={active:true,closed:false,stopped:false}; t.getMediaStreamTrack=()=>({stop(){t.active=false}});t.stop=()=>{t.stopped=true};t.close=()=>{t.closed=true};return t; };

test('end releases native capture even if the Agora preview stop throws', () => {
 const camera=track();camera.stop=()=>{throw Error('preview detached')};releaseTrack(camera);
 assert.equal(camera.active,false);assert.equal(camera.closed,true);
});
test('closing a show releases audio and video synchronously and is repeatable', () => {
 const scope=createTrackScope(),audio=scope.own(track()),video=scope.own(track());scope.close();scope.close();
 assert.equal(audio.active,false);assert.equal(video.active,false);assert.equal(audio.closed,true);assert.equal(video.closed,true);
});
test('camera resolving after unmount/end is immediately released', async () => {
 const request=deferred(),scope=createTrackScope();const pending=acquireTracks(scope,[()=>request.promise]);
 scope.close();const camera=track();request.resolve(camera);await pending;
 assert.equal(camera.active,false);assert.equal(camera.closed,true);
});
test('partial microphone failure cannot leak a successful camera permission', async () => {
 const cameraRequest=deferred(),scope=createTrackScope();
 const pending=acquireTracks(scope,[async()=>{throw Error('microphone denied')},()=>cameraRequest.promise]);
 await assert.rejects(pending,/microphone denied/);const camera=track();cameraRequest.resolve(camera);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(camera.active,false);assert.equal(camera.closed,true);
});
test('closing one effect cannot release another effect’s tracks', () => {
 const first=createTrackScope(),second=createTrackScope();const old=first.own(track()),current=second.own(track());
 first.close();assert.equal(old.active,false);assert.equal(current.active,true);second.close();assert.equal(current.active,false);
});
