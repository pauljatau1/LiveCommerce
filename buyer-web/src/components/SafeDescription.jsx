import {createElement} from 'react';
import {descriptionNodes} from '../description.js';
export default function SafeDescription({value}) {
 const render=(nodes)=>nodes.map((node,key)=>node.tag ? createElement(node.tag,{key},...render(node.children)) : node.text);
 return <div className="product-description">{render(descriptionNodes(value))}</div>;
}
