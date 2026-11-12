Seller profile reads could erase the store name, phone and pickup-completion flags whenever a phone started with 0. Studio correctly saves that local phone format, so the next profile request undid setup. Profile reads now keep seller details intact by default. The historical reset remains behind `LEGACY_PHONE_RESET`, off by default.

Store, pickup and bank saves reload the complete seller from the server into auth context and storage. Getting started continues through pickup → bank → “You're set”; standalone pickup editing keeps its return-to-origin behavior. Store profile loads its fields from onboarding GET, refuses an empty name, and shows the server's pickup address. Setup pre-fills the signup name and courier phone, with cached answers scoped to the signed-in seller.

Saved product descriptions render basic paragraphs, emphasis and lists through the same allowlist policy in both independently deployed apps. Scripts, embedded content and all attributes are dropped before React creates elements. The product editor handles nested creation responses and opens a fetched product detail immediately; a failed follow-up read does not cause another product creation.

The launch categories come from one list: Women, Men, Thrift, Shoes, Bags, Accessories. Public lists, search, studio pickers and the listing assistant hide the old categories. The database records stay; an existing product's category is retained on edit. Automatic show descriptions and notes use the configured service states. Studio routes explicitly suppress the classic cookie banner. Failed Google search keeps the typed street in the manual form.

### Phone audit

The single server normalizer stores Nigerian phones as 11 digits starting with 0. It accepts supported older 10-digit and Nigerian international representations without truncating invalid numbers. Seller/buyer schema setters cover signup, profile, account updates, pickup contacts and embedded delivery addresses, including query updates.

| Earlier assumption | Change |
| --- | --- |
| Seller profile GET treated a leading 0 as obsolete | Destructive block retained behind `LEGACY_PHONE_RESET`, default off. |
| Studio signup stripped 0 to satisfy the classic 10-digit schema | Studio uses an 11-digit schema; classic schema remains available to classic screens. |
| Business-information formatter stripped 0 | Uses the shared normalizer. Historical formatter and validation remain behind `LEGACY_PHONE_FORMAT`, default off. `businessNumber` also holds registration IDs in older data, so it is not globally cast as a phone. |
| Seller profile completion rejected a leading 0 | Uses the shared normalizer; old international regex retained behind `LEGACY_PHONE_FORMAT`. |
| Seller/buyer phone lookups compared only one representation | Match canonical and existing legacy forms without rewriting data on read. |
| SMS helpers assumed incoming phones were already international | Convert through the shared normalizer at the Termii/AWS transport boundary. |
| Shipbubble accepted any digit sequence, including invalid lengths | Uses the shared normalizer before international formatting. Previous formatter retained behind `LEGACY_PHONE_TRANSPORT`, default off. Pickup prefers the warehouse courier contact. |
| Paystack DVA accepted only already-local input | Normalizes existing supported phone forms before the provider call. Invalid saved phones still require repair. |
| Legacy socket order contact copied raw phone text | Uses the shared normalizer. |
| Legacy buyer registration/profile validators accepted arbitrary phone text | Validate supported forms before persistence. |

Old account fixtures were changed to valid local phones so unrelated repository/controller tests still exercise the new persistence rules. Existing invalid records are not bulk rewritten.

### Recovery report — no live run performed

`node server/scripts/report-wiped-sellers.js` is a dry run: prints the query plan without connecting to a database. After Paul approves a real read, `--report` lists sellers with an empty/missing store name and at least one product or stream, with IDs and activity counts. It is read-only in every mode and never guesses or writes replacement details. Paul can ask those sellers to re-enter their details.

### Checks

- Full server suite: 264 suites / 3,895 tests passed. Buyer: 22 tests passed. Studio: 44 tests passed. Both production builds passed.
- Browser checks at 390px with invented data and mocked APIs: authoritative profile fields, refresh of context/storage after saving, pickup → bank → finished, signup prefill, preserved street after Google failure, launch-only category choices and a new product opening without skeletons.
- Actual browser HTML parsing and React rendering in both apps: paragraphs/emphasis/lists survive; scripts, images, SVG, MathML, event handlers, URLs and styles do not render or execute.
- No accounts created, staging writes or database repair performed.

### Phone previews (mocked data)

| Screen | Before | After |
| --- | --- | --- |
| Store profile | [Before](screenshots/seller-profile-wipe/before/store-profile.png) | [After](screenshots/seller-profile-wipe/after/store-profile.png) |
| Product description | [Before](screenshots/seller-profile-wipe/before/product-description.png) | [After](screenshots/seller-profile-wipe/after/product-description.png) |
| Save pickup inside setup | [Returned to Me](screenshots/seller-profile-wipe/before/pickup-returned-to-me.png) | [Continues to bank](screenshots/seller-profile-wipe/after/pickup-continues-to-bank.png) |

Additional previews: [finished setup](screenshots/seller-profile-wipe/after/getting-started-finished.png), [signup name](screenshots/seller-profile-wipe/after/signup-store-prefill.png), [signup courier phone](screenshots/seller-profile-wipe/after/signup-courier-prefill.png), [search fallback](screenshots/seller-profile-wipe/after/search-fallback-keeps-street.png), [new product loaded](screenshots/seller-profile-wipe/after/new-product-loaded.png), [shop description](screenshots/seller-profile-wipe/after/shop-safe-description.png).

No new cramped layout found in these phone checks. The full product detail scrolls normally; the buyer item description is collapsed until requested.

### Staging after merge

1. Sign up as a seller with an 11-digit phone. Confirm store name and courier phone carry into setup.
2. Save store, pickup and bank in order; reach “You're set”. Reload profile repeatedly and confirm the database name, phone and pickup flags stay intact.
3. Edit store, standalone pickup and bank. Check Me, Home and the go-live guard use the saved data immediately; return to the origin screen after standalone edits.
4. Create a product with HTML paragraphs, emphasis and a list. Save and confirm its detail loads immediately; check the buyer's item view too.
5. Check category pickers show only launch categories; edit an existing legacy-category product and confirm its saved category is retained.
6. Force a Google suggestion request to fail after typing a street. Confirm the manual Street address retains it. Confirm no classic cookie banner on studio routes.
7. Review the dry-run recovery report plan. Paul approves any live report or manual restoration separately.

Render settings: leave `LEGACY_PHONE_RESET`, `LEGACY_PHONE_FORMAT`, `LEGACY_PHONE_TRANSPORT` and `LEGACY_CATEGORIES` unset. They are compatibility switches, default off; none is required for launch.

Paul merges.

_Generated by [Codex](https://openai.com/codex/)_
