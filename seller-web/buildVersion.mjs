import {randomUUID} from 'node:crypto';
export default function buildVersion(){
 const version=`${Date.now()}-${randomUUID()}`;
 return {name:'build-version',config:()=>({define:{__APP_BUILD_VERSION__:JSON.stringify(version)}}),generateBundle(){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({version})});}};
}
