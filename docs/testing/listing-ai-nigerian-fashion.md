# Listing AI: Nigerian fashion guide

The editable prompt guide is `server/src/services/ai/nigerianFashionGuide.js`.
`franchise` and `character` remain in the legacy draft schema and old drafts;
they are excluded from the active Gemini response schema.

The helper asks quantity (per colour when applicable), original/replica, and one
clarification card. Unknown condition and uncertain fabric/style share that card
with separate chips, keeping at most three question cards. Price and editable
listing rows remain available. Colour counts are saved on the product and summed
into stock. In Run again, colour chips suggest an editable run note; the existing
auction system still sells/decrements one unit of total stock per run. Colour
counts are the seller's initial allocation, not independently decremented live
variant inventory. Sellers choose the colour they are holding for each run.

A seller-bound signed draft snapshot retains the original title, category, fabric
and local style through refinements and the full-form handoff. Successful product
creation records changed fields in `ListingCorrection`; unchanged/manual listings
produce no correction. Admin → Listing AI corrections shows the list, newest
first, 50 per page. No automatic guide updates are made from these records.

## How to check on staging

After merge/deployment, open https://livecommerce-studio.onrender.com/studio/list
with an existing seller account. Health is at
https://livecommerce-api-4s2b.onrender.com/health.

Try real photos of:

| Photo | Expected draft |
| --- | --- |
| Adire bubu gown | Local-name-first title such as “Adire Bubu Gown, Indigo”; fabric Adire, style Bubu; tags include adire/resist-dye and bubu/gown. |
| Ankara buba and iro | Fabric Ankara, style Buba and iro; English blouse/wrapper helper and tags. |
| Aso-oke gele | Fabric Aso-oke, style Gele; head-wrap helper and tags. |
| Senator outfit | Style Senator; tunic/trousers helper; no guessed Atiku fabric unless supported. |
| Plain jeans | Plain English jeans title/tags; no forced Nigerian fabric/style. |
| Same bubu design in several colours | Separate colour labels and “How many of each colour?”; description contains no colour list. Enter counts and check total stock after publish. |

For every case, check that Unknown condition asks “Is it new with tags, thrift or
fairly used?” and that tapping an answer fills the condition row. Low/medium
fabric/style confidence must offer confirmation chips, including Other. Quantity
and original/replica must still be asked, without entertainment fields or size
questions. Edit the local style/fabric rows directly too.

Publish one corrected draft, then verify its before/after values in the admin
correction list. Ordinary seller/buyer access to the list must be denied. Put the
multi-colour product in an auction show; check that the run-note sheet offers its
colour labels, then run again and check that the chosen note reaches the buyer.

Live photo/model checks were deliberately not run in development: Gemini output
is mocked in tests and the staging seller checks are reserved for the owner.
