export function wordPrefix(value,limit){
 const text=String(value || '').trim().replace(/\s+/g,' ');
 if(text.length<=limit)return text;
 const words=text.split(' ');let result='';
 for(const word of words){const next=result?`${result} ${word}`:word;if(next.length>limit)break;result=next;}
 return result.replace(/[&+,:;–-]+$/,'').trim();
}
export function generatedShowTitle(items,type='auction',limit=80){
 const prefix=type==='auction'?'Live auction':'Live drop';
 const names=items.map(p=>String(p.name || '').split(/[,(]|\s[–-]\s/)[0].trim()).filter(Boolean);
 if(!names.length)return prefix;
 const pair=names.slice(0,2).join(' & '),rest=names.length>2?` + ${names.length-2} more`:'';
 if(`${prefix}: ${pair}${rest}`.length<=limit)return `${prefix}: ${pair}${rest}`;
 const suffix=names.length>1?` + ${names.length-1} more`:'';
 const name=wordPrefix(names[0],limit-prefix.length-2-suffix.length) || 'Selected items';
 return `${prefix}: ${name}${suffix}`;
}
