// Launch catalogue for the studio: clothing. Mirrors server/src/config/catalogue.js.
// There are no size fields: sellers write size in the title or description.

// Previous local fallback retained but inactive. The API owns the launch list.
export const LEGACY_LAUNCH_CATEGORIES = ['Women', 'Men', 'Thrift', 'Shoes', 'Bags', 'Accessories'];

export const CONDITIONS = ['New with tags', 'Thrift', 'Fairly used'];

// Stored values stay 'official' / 'replica' / 'unknown'; buyers and sellers see these words.
export const AUTHENTICITY = [['official', 'Original'], ['replica', 'Replica'], ['unknown', 'Not sure']];
export const authenticityLabel = (v) => AUTHENTICITY.find(([k]) => k === v)?.[1] || null;
