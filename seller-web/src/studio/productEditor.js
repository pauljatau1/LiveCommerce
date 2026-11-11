// Product editor: turns a saved product (or a listing-agent draft) into the form,
// and the form back into the payload the classic product API expects.
//
// The form shows colours only. Size variants and dimensions are not shown, but
// anything a product already has is carried through on save untouched.

const UNITS = { kg: 1, g: 1000, lb: 2.20462, oz: 35.274 };

export const MAX_WEIGHT_KG = 30;
export const WEIGHT_FALLBACK_KG = 1;
export const DEFAULT_DIMENSIONS = { length: 10, width: 10, height: 10 };
export const MAX_PHOTOS = 5;

// Quick picks under the weight field
export const WEIGHT_PICKS = [
  ['Light top', 0.5],
  ['Dress or trousers', 1],
  ['Jacket or set', 2],
  ['Shoes or bag', 3],
];

// The line under the weight field, by where the weight came from
export const WEIGHT_HINTS = {
  agent: "Guessed from your photos. Change it if it's off.",
  category: 'Typical for this category',
  saved: '',
  typed: '',
};

export const WEIGHT_ERROR = 'Enter the weight in kg, for example 1';

export const isColourVariant = (v) => /^colou?r$/i.test(String(v?.name || '').trim());

const toNumber = (value) => { const t = String(value ?? '').trim().replace(/,/g, '.'); return t ? Number(t) : NaN; };
const toKg = (value, unit = 'kg') => Number(value) / (UNITS[unit] || 1);
const roundKg = (kg) => Math.round(kg * 1000) / 1000;

// '' when fine, else a plain sentence
export function weightError(value) {
  if (value === '' || value === null || value === undefined) return WEIGHT_ERROR;
  const kg = toNumber(value);
  return Number.isFinite(kg) && kg > 0 && kg <= MAX_WEIGHT_KG ? '' : WEIGHT_ERROR;
}

// Typical weight for a category, from the server's table ({ fallback, categories })
export function categoryWeight(table, category) {
  const kg = Number(table?.categories?.[category]);
  if (Number.isFinite(kg) && kg > 0) return kg;
  const fallback = Number(table?.fallback);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : WEIGHT_FALLBACK_KG;
}

// Where the weight starts: the listing agent's guess, the saved weight, or the category default
export function initialWeight(p = {}, table = null) {
  const agentKg = Number(p.weightKg ?? p.weight);
  if (p.fromDraft && agentKg > 0) return { weight: roundKg(agentKg), weightSource: 'agent' };
  const saved = p.shippingInfo?.weight?.value ?? (p._id ? p.weight : undefined);
  if (Number(saved) > 0) return { weight: roundKg(toKg(saved, p.shippingInfo?.weight?.unit || 'kg')), weightSource: 'saved' };
  return { weight: categoryWeight(table, p.category?.name || p.category), weightSource: 'category' };
}

export const imagePayload = (image) => ({
  ...image,
  data: (image.data || image.url || '').replace(/^data:[^,]+,/, ''),
  contentType: image.contentType || 'image/jpeg',
});

export const variantPayload = (variants = []) => variants.map((v) => ({
  ...v,
  images: (v.images || []).map(imagePayload),
  ...(v.subVariants ? { subVariants: variantPayload(v.subVariants) } : {}),
  ...(v.subSubVariants ? { subSubVariants: variantPayload(v.subSubVariants) } : {}),
}));

let rowKey = 0;
const nextKey = () => `c${++rowKey}`;

// One editable row per colour variant; `ref` is the saved variant, kept whole
export const colourRow = (v = null) => ({
  key: nextKey(),
  value: v?.value || '',
  stock: Number(v?.totalStock ?? v?.stock ?? 0) || 0,
  images: v?.images || [],
  ref: v,
});

export const coloursTotal = (colours = []) => colours.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);

// Saved variants with the colour rows written back. Every other variant (sizes,
// and sizes under a colour) is kept exactly as saved.
export function mergeVariants(saved = [], colours = [], price = 0) {
  const byRef = new Map(colours.filter((c) => c.ref).map((c) => [c.ref, c]));
  const write = (c, base) => ({ ...base, value: c.value.trim(), totalStock: Number(c.stock) || 0, images: c.images || [] });
  const kept = saved.flatMap((v) => {
    if (!isColourVariant(v)) return [v];
    const row = byRef.get(v);
    return row ? [write(row, v)] : []; // a colour the seller removed
  });
  const added = colours.filter((c) => !c.ref).map((c) => write(c, { name: 'Colour', price: Number(price) || 0, subVariants: [] }));
  return [...kept, ...added];
}

export function productPayload(form, original = {}) {
  const kg = toKg(toNumber(form.weight), form.weightUnit);
  const colours = form.colours || [];
  const stock = colours.length ? coloursTotal(colours) : Number(form.stock);
  const savedShipping = original.shippingInfo || {};
  const savedDims = savedShipping.dimensions;
  const dimensions = savedDims && ['length', 'width', 'height'].every((k) => Number(savedDims[k]) > 0)
    ? { length: Number(savedDims.length), width: Number(savedDims.width), height: Number(savedDims.height) }
    : { ...DEFAULT_DIMENSIONS };
  const tags = Array.isArray(form.tags) ? form.tags : String(form.tags || '').split(',');
  return {
    name: form.name.trim(),
    description: form.description,
    price: Number(form.price),
    salePrice: Number(form.salePrice || 0),
    stock,
    weight: kg,
    condition: form.condition,
    status: form.status,
    category: form.category,
    subCategory: form.subCategory || undefined,
    brand: form.brand,
    sku: form.sku,
    upc: form.upc,
    fabric: form.fabric,
    localStyle: form.localStyle,
    tags: tags.map((t) => String(t).trim()).filter(Boolean),
    authenticity: form.authenticity,
    images: form.images.map(imagePayload),
    variants: variantPayload(mergeVariants(form.variants, colours, form.price)),
    colourVariants: colours.map(c => c.value.trim()),
    colourQuantities: colours.map(c => ({ colour: c.value.trim(), quantity: Number(c.stock) || 0 })),
    ...(original.fromDraft ? { draftProof: original.draftProof } : {}),
    shippingInfo: {
      ...savedShipping,
      weight: { value: kg, unit: 'kg' },
      dimensions,
      freeShipping: savedShipping.freeShipping || false,
      shippingClass: savedShipping.shippingClass || 'standard',
    },
  };
}

// Keys the form never shows, even if the product has them
const HIDDEN = ['size', 'sizes', 'dimensions', 'length', 'width', 'height', 'freeShipping', 'shippingClass'];

export function editorForm(p = {}, weightTable = null) {
  const form = {
    ...p,
    name: p.name || '',
    description: p.description || '',
    price: p.price ?? '',
    salePrice: p.salePrice ?? '',
    stock: p.stock ?? 1,
    ...initialWeight(p, weightTable),
    weightUnit: 'kg',
    condition: p.condition || '',
    status: p.status || 'active',
    category: p.category?.name || p.category || '',
    subCategory: p.subCategory?.name || p.subCategory || '',
    brand: p.brand || '',
    sku: p.sku || '',
    upc: p.upc || '',
    fabric: p.fabric || '',
    localStyle: p.localStyle || '',
    authenticity: p.authenticity || 'unknown',
    tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : String(p.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    images: p.images || [],
    variants: p.variants || [],
    colours: p.colourVariants?.length
      ? p.colourVariants.map(colour => {
        const saved = (p.variants || []).find(v => isColourVariant(v) && v.value?.toLowerCase() === colour.toLowerCase());
        const count = (p.colourQuantities || []).find(c => c.colour?.toLowerCase() === colour.toLowerCase());
        return {
          ...colourRow(saved), value: colour,
          stock: count ? Number(count.quantity) || 0 : Number(saved?.totalStock ?? saved?.stock ?? 0),
        };
      })
      : (p.variants || []).filter(isColourVariant).map(colourRow),
  };
  HIDDEN.forEach((k) => delete form[k]);
  return form;
}

// Everything still missing, in the order the fields appear. [{ key, text }]
export function missingFields(form) {
  const out = [];
  if (!form.images?.length) out.push({ key: 'photos', text: 'Add at least one photo. Buyers look at photos first.' });
  if (!form.name?.trim()) out.push({ key: 'name', text: 'Add a name so buyers know what it is.' });
  if (!(toNumber(form.price) > 0)) out.push({ key: 'price', text: 'Add a price. Buyers need it to bid or buy.' });
  if (!form.colours?.length && !(Number(form.stock) >= 0)) out.push({ key: 'stock', text: 'Add how many you have.' });
  if (!form.condition) out.push({ key: 'condition', text: 'Pick one so buyers know what to expect.' });
  if (!form.category) out.push({ key: 'category', text: 'Pick a category so buyers can find it.' });
  if ((form.colours || []).length > 12) out.push({ key: 'colours', text: 'Use up to 12 colours.' });
  if ((form.colours || []).some((c) => !c.value.trim())) out.push({ key: 'colours', text: 'Name each colour, or remove it.' });
  if ((form.colours || []).some(c => !Number.isInteger(Number(c.stock)) || Number(c.stock) < 0 || Number(c.stock) > 999)) out.push({ key: 'colours', text: 'Use a whole stock count from 0 to 999 for each colour.' });
  if (new Set((form.colours || []).map(c => c.value.trim().toLowerCase())).size !== (form.colours || []).length) out.push({ key: 'colours', text: 'Use each colour name only once.' });
  const w = weightError(form.weight);
  if (w) out.push({ key: 'weight', text: w });
  return out;
}
