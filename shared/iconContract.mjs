import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):/\.[jt]sx?$/.test(e.name)&&!e.name.endsWith('.test.js')?[join(dir,e.name)]:[]);
// Icon objects and usages are intentionally a simple, statically named API.
export function missingIcons(root,ui){
 const text=readFileSync(ui,'utf8');
 const block=text.slice(text.indexOf('export const Icon = {'),text.indexOf('\n};',text.indexOf('export const Icon = {')));
 const names=new Set([...block.matchAll(/^\s{2}(\w+):/gm)].map(m=>m[1]));
 if(!names.size)throw Error(`No icon definitions found in ${ui}`);
 return files(root).flatMap(file=>[...readFileSync(file,'utf8').matchAll(/\bIcon(?:\.(\w+)|\[['"](\w+)['"]\])/g)].map(m=>m[1]||m[2]).filter(name=>!names.has(name)).map(name=>`${file}: Icon.${name}`));
}
