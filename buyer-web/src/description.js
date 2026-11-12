const ALLOWED = new Set(['p','br','strong','b','em','i','u','s','ul','ol','li','blockquote']);
const DROP = new Set(['script','style','iframe','object','embed','svg','math','template','noscript']);
export function descriptionNodes(value, doc = globalThis.document) {
  if (!doc) return [{text: String(value || '')}];
  const template=doc.createElement('template');
  template.innerHTML=String(value || '');
  const visit=nodes=>Array.from(nodes).flatMap(node=>{
    if(node.nodeType === 3)return [{text:node.textContent}];
    if(node.nodeType !== 1)return [];
    const tag=node.tagName.toLowerCase();
    if(DROP.has(tag))return [];
    const children=visit(node.childNodes);
    return ALLOWED.has(tag) ? [{tag,children}] : children;
  });
  return visit(template.content.childNodes);
}
