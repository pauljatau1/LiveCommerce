const { ObjectId } = require('mongodb');

/**
 * Returns "file-name" from ".../path/file-name.mp4" (query-string ok).
 * If the url doesn’t actually end in “.mp4”, returns null.
 */
function extractFileNameFromPath(path = '') {
  if (!path) return '';

  // strip query or hash
  const clean = path.split(/[?#]/)[0];

  // grab the final segment
  const last = clean.substring(clean.lastIndexOf('/') + 1);

  // must end in .mp4  (case-insensitive)
  if (!/\.mp4$/i.test(last)) return '';

  return last.slice(0, -4);      // drop ".mp4"
}

module.exports = {
  /**
   * Up = apply migration
   */
  async up(db, client) {
    const products = db.collection('products');

    const cursor = products.find(
      { blips: { $exists: true, $ne: [] } },   // only products that actually have blips
      { projection: { blips: 1 } }
    );

    let touched = 0;

    for await (const doc of cursor) {
      let changed = false;

      const updatedBlips = doc.blips.map((b) => {
        const blip = { ...b };

        /* —— processed flag ———————————————————————— */
        if (
          blip.url &&
          typeof blip.url === 'string' &&
          blip.url.toLowerCase().endsWith('.mp4') &&
          blip.processed !== true
        ) {
          blip.processed = true;
          changed = true;
        }

        /* —— key back-fill ———————————————————————— */
        if (!blip.key || blip.key === '') {
          const uuid = extractFileNameFromPath(blip.url);
          if (uuid) {
            blip.key = uuid;
            changed = true;
          }
        }

        return blip;
      });

      if (changed) {
        await products.updateOne(
          { _id: doc._id },
          { $set: { blips: updatedBlips } }
        );
        touched += 1;
      }
    }

    console.log(`\u2714 Updated ${touched} product(s)`);
  },


  async down(db, client) {}
};
