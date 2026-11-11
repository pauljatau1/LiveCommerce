import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { account, errorText } from './api';
import { TopBar, Problem, Skeleton } from './ui';
import { editorForm, productPayload } from './productEditor';
import { CONDITIONS, AUTHENTICITY } from './catalogue';

function Photos({ images, onChange }) {
  const [error, setError] = useState('');
  const inputId = useId();
  const add = async e => {
    try { const added = await Promise.all([...e.target.files].map(file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ url: reader.result, contentType: file.type }); reader.onerror = reject; reader.readAsDataURL(file); }))); onChange([...images, ...added]); } catch { setError('Couldn’t read that photo. Please try again.'); }
    e.target.value = '';
  };
  return <div className="fl"><span className="lab">Photos</span><div className="edit-photos">{images.map((img, i) => <div key={i}><img src={img.url || img.data} alt={`Photo ${i + 1}`} /><button className="link" type="button" onClick={() => onChange(images.filter((_, n) => n !== i))}>Remove {i + 1}</button></div>)}</div><label className="btn3" htmlFor={inputId}>Add photos</label><input id={inputId} className="sr" type="file" accept="image/*" multiple onChange={add} />{error && <span role="alert">{error}</span>}</div>;
}
function Variants({ variants, onChange, depth = 0 }) {
  const childKey = depth === 0 ? 'subVariants' : 'subSubVariants';
  const update = (i, patch) => onChange(variants.map((v, n) => n === i ? { ...v, ...patch } : v));
  return <div className="entry-form">{variants.map((v,i) => <fieldset key={i} className="card edit-variant"><legend>Option {i + 1}</legend>
    {['name','value','price', depth === 0 ? 'totalStock' : 'stock', ...(depth === 2 ? ['sku'] : [])].map(key => <label className="fl" key={key}><span className="lab">{{ name: 'Option name (e.g. Size)', value: 'Value (e.g. M)', price: 'Price (₦)', totalStock: 'Quantity', stock: 'Quantity', sku: 'SKU' }[key]}</span><input className="in" required={['name','value'].includes(key)} type={['price','stock','totalStock'].includes(key) ? 'number' : 'text'} min="0" step={key === 'price' ? '0.01' : '1'} value={v[key] ?? ''} onChange={e => update(i, { [key]: ['price','stock','totalStock'].includes(key) ? Number(e.target.value) : e.target.value })} /></label>)}
    <Photos images={v.images || []} onChange={images => update(i, { images })} />{depth < 2 && <Variants depth={depth+1} variants={v[childKey] || []} onChange={children => update(i, { [childKey]: children })} />}<button className="link" type="button" onClick={() => onChange(variants.filter((_, n) => n !== i))}>Remove option</button>
  </fieldset>)}<button type="button" className="btn3" onClick={() => onChange([...variants, { name: '', value: '', price: 0, [depth ? 'stock' : 'totalStock']: 0, images: [] }])}>Add {depth ? 'nested ' : ''}option</button></div>;
}
export default function ProductEditor() {
  const { id } = useParams(), location = useLocation(), navigate = useNavigate();
  const [original, setOriginal] = useState(location.state?.listingDraft || {}), [form, setForm] = useState(id ? null : editorForm(location.state?.listingDraft));
  const [categories, setCategories] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { account.categories().then(r => setCategories(Array.isArray(r) ? r : r.categories || r.data || [])).catch(e => setError(errorText(e, 'Couldn’t load categories. Try again.'))); if(id) account.product(id).then(r => { const p = r.product || r.data || r; setOriginal(p); setForm(editorForm(p)); }).catch(e => setError(errorText(e, 'Couldn’t load this product.'))); }, [id]);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const field = (key, title, type = 'text', props = {}) => <label className="fl" key={key}><span className="lab">{title}</span><input className="in" type={type} value={form[key]} onChange={e => set(key, e.target.value)} {...props} /></label>;
  const select = (key, title, options, required = false) => <label className="fl"><span className="lab">{title}</span><select className="sel" required={required} value={form[key]} onChange={e => { set(key, e.target.value); if(key === 'category') set('subCategory', ''); }}><option value="">Choose {title.toLowerCase()}</option>{options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}</select></label>;
  const save = async e => { e.preventDefault(); setError(''); if (!form.images.length) { setError('Add at least one photo.'); return; } setBusy(true); try { const r = await account.saveProduct(id, productPayload(form, original)); navigate(`/studio/products/${id || r._id || r.product?._id || r.data?._id}`, { replace: true, state: { studioNotice: 'Product saved.' } }); } catch(e) { setError(errorText(e, 'Couldn’t save this product. Please try again.')); } finally { setBusy(false); } };
  const sub = categories.find(c => c.name === form?.category)?.subCategories || [];
  return <div className="studio-app"><TopBar title={id ? 'Edit product' : 'Finish your listing'} onBack={() => navigate(id ? `/studio/products/${id}` : '/studio/list')} /><div className="st-inner">{error && <Problem text={error} />}{!form ? <Skeleton h={240} /> : <form className="entry-form" onSubmit={save}>
    <Photos images={form.images} onChange={images => set('images', images)} />{field('name','Title', 'text', { required: true })}<div className="fl"><span className="lab" id="product-description">Description</span><SunEditor setContents={original.description || ''} onChange={value => set('description', value)} setOptions={{ height: '140px', buttonList: [['bold', 'italic', 'list', 'removeFormat']], defaultStyle: 'font-family: Nunito,sans-serif;font-size:15px' }} /></div>
    {select('category','Category', categories.map(c => c.name), true)}{select('subCategory','Sub-category', sub.map(c => typeof c === 'string' ? c : c.name))}
    <div className="edit-grid">{field('price','Price (₦)','number',{ min: 0, step: '0.01', required: true })}{field('salePrice','Sale price (₦)','number',{min:0,step:'0.01'})}{field('stock','Quantity','number',{min:0,step:1,required:true})}{select('condition','Condition', [...new Set([...CONDITIONS,form.condition].filter(Boolean))],true)}</div>
    {select('status','Status', [{value:'active',label:'Active'},{value:'draft',label:'Draft'}, ...(form.status === 'offline_auction' ? [{value:'offline_auction',label:'Auction'}] : [])],true)}
    <details className="card edit-variant"><summary>Fabric, style and more</summary><div className="entry-form">{field('fabric','Fabric')}{field('localStyle','Local style')}{field('brand','Brand')}{select('authenticity','Original or replica', AUTHENTICITY.map(([value,label]) => ({value,label})))}{field('tags','Tags (separate with commas)')}{field('sku','SKU')}{field('upc','UPC / barcode')}</div></details>
    <details className="card edit-variant"><summary>Weight and delivery</summary><div className="entry-form"><div className="edit-grid">{field('weight','Weight','number',{min:0.001,step:'any',required:true})}{select('weightUnit','Unit',['kg','g','lb','oz'],true)}</div><div className="edit-grid">{['length','width','height'].map(key => field(key,`${key[0].toUpperCase()+key.slice(1)} (cm)`,'number',{min:0.1,step:'any',required:true}))}</div>{select('shippingClass','Shipping class',['standard','express','economy'],true)}<label className="hint"><input type="checkbox" checked={form.freeShipping} onChange={e => set('freeShipping',e.target.checked)} /> Free shipping</label></div></details>
    <details className="card edit-variant"><summary>Product options ({form.variants.length})</summary><Variants variants={form.variants} onChange={variants => set('variants',variants)} /></details><button className="btn" disabled={busy}>{busy ? 'Saving…' : id ? 'Save product' : 'Publish product'}</button>
  </form>}</div></div>;
}
