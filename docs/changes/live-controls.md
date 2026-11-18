# Live studio controls

Branch `fix/live-controls`, based on `main` at `cb31d763` (#63). Paul opens the PR and merges.

The two device states follow the T8 PNG designs supplied in #63. The second device shows the Go live page with the live placeholder and current show details. The former host shows the stopped-camera overlay with its last local frame (or the current product photo when a frame is unavailable). No preview, microphone or camera is opened on a foreign device before an explicit takeover. Device labels and times come from the successful host claim, not fixed sample copy.

## Changes by request

| Item | Files |
| --- | --- |
| Settings icon and icon checks | `seller-web/src/studio/{ui.jsx,Live.jsx,ListingAgent.jsx,icons.test.js}`, `buyer-web/tests/icons.test.js`, `shared/iconContract.mjs` |
| Auto quality retained; Go live tip | `seller-web/src/studio/GoLive.jsx`; existing `hostMedia.js` quality logic is unchanged |
| One host device and one live show | `server/src/services/hostSessions.js`, `services/hostPresence.js`, `models/{Stream,Seller}.js`, `routes/{streamRoutes,studioRoutes}.js`, `controllers/streamController.js`, `socket/socketManager.js`; studio `{hostSession.js,HostGate.jsx,HostDeviceState.jsx,studio.css,api.js,GoLive.jsx,Live.jsx}` |
| App photo/address confirmations | Studio `{ConfirmSheet.jsx,ProductEditor.jsx,ListingAgent.jsx}`; shop `{components/ConfirmSheet.jsx,pages/Me.jsx}` |
| Hide expired timers and stray zero | Shop `{components/watch.jsx,pages/Watch.jsx}`; studio `Live.jsx` |
| Safe updates and cache headers | Each app's `buildVersion.mjs`, `src/{buildUpdates.mjs,main.jsx}`, `vite.config.js`; studio `api.js` and `Live.jsx`; shop `api.js`, `payments.js`, `StayOnStreamTopUps.jsx`, `Watch.jsx`; `render.yaml` |

Host session bearer IDs stay in document memory; Mongo stores a hash. A separate public revision is used for conditional takeovers. Other devices cannot act using the status response or stored hash. Short persisted action leases prevent a takeover during a host control, and a seller lease serialises starts across shows. Takeovers claim the revision displayed by the requesting screen (with no automatic retry), preserve auction data, notes and chat, invalidate the old grace nonce, cancel its job and notify the old host. Both hosts use the same Agora UID. A refused start uses a separate `already_live` error and clears its scheduled-show ownership reservation. Existing settlement paths are unchanged.

A freshly reloaded tab explicitly reclaims ownership; keeping the ID only in memory prevents a duplicated tab from inheriting authority. Background/foreground resume keeps the document's ID.

Legacy behaviour remains switchable: `LEGACY_MULTI_HOST` on the server and `VITE_LEGACY_MULTI_HOST` in studio; `VITE_LEGACY_BROWSER_CONFIRM` in either app; `VITE_LEGACY_BUILD_CACHE` in either app. All default off. The legacy multi-host rollback requires both server and studio settings.

Each independent Render app root contains its updater and build plugin; tests require the copies to stay identical. No parent-directory runtime file is needed by a static-site build. Version checks run on focus, visibility and every five minutes; a pending update waits for a safe route transition or idle period. Sheets, focused fields, writes, bid activity, payment SDK activity and seller live routes block automatic refresh. Live sellers see the update note in the existing prompts. `render.yaml` provides no-cache HTML and immutable hashed-asset headers for the two static sites; no Render configuration has been published. If the existing static sites are managed manually, apply these same headers there; merging a Blueprint does not update a manually managed site by itself. Tabs already open before the updater's first deployment still need one manual refresh.

## Tests added

- `server/tests/services/hostSessions.test.js`: seven cases for holder-only actions, secret/hash non-replay, takeover/UID/grace/preserved data, concurrent takeovers, active-action exclusion, refused/concurrent show starts, ended shows and device captions.
- Both icon tests audit all app `Icon` names through `shared/iconContract.mjs`.
- Both build-update suites exercise the real policy helper via `shared/buildUpdates.test.mjs`, including DOM/dialog/focus/payment/write/live guards and identical deployment copies.
- Studio `hostSession.test.js`: document isolation and clearing authority with local frame details.
- `tests/visual/live-controls.browser.mjs`: T8 layouts, no foreign camera, exact displayed-revision CAS, refused second-show message, track cleanup, Go live tip, photo confirmations in editor and listing helper, buyer confirmation and update note. Existing buyer Watch checks now cover active zero timers and zero bid history on unsold items.

## Validation

- Full server Jest run: **271 suites / 3,965 tests passed**. Additional focused host/route run: **27 tests passed**; latest host-session assertions also passed, including real device captions, unchanged auction/chat/notes data and a stale grace job after takeover.
- Studio: **69 tests passed**. Shop: **40 tests passed**.
- Both production builds passed; seller uses a 6,144 MB heap. Both builds emit `dist/version.json`.
- Host browser recovery checks: 375×667 and 390×844. Existing buyer Watch checks: 320×568, 375×600, 390×700 and 1280×800, including active zero timer, unsold state and no literal zero.
- New 390px checks: host takeover/move-back, old tracks closed, no second-device camera, settings SVG, Go live tip, both photo editors' Keep/Remove and last-photo rule, buyer address confirmation, and update note.
- Updater tests cover same/new/offline version checks, dialogs, focus, hidden pages, writes, payments, live seller blocking and recap navigation. Icon checks scan studio and shop source for undefined `Icon` names. `hostSession.test.js` verifies separate-document authority and clearing it on movement.
- Existing warnings remain: duplicate Mongoose indexes, AWS SDK v2 deprecation/Jest open handles, stale Browserslist data, a duplicate `landmark` key in AddressSheet and large bundle chunks.

Screenshots at 390px:

- [Settings rail](../screenshots/live-controls/rail-settings-390.png)
- [Go live tip](../screenshots/live-controls/go-live-tip-390.png)
- [Show live on another device](../screenshots/live-controls/other-device-390.png)
- [Moved on the former device](../screenshots/live-controls/moved-device-390.png)
- [Remove photo sheet](../screenshots/live-controls/remove-photo-390.png)

Browser checks use actual components and mocked API/socket/Agora responses, not real staging accounts or broadcasts. Actual iPhone media handoff and Render cache headers still need staging verification after merge.

## Staging checks after merge

1. Open the same live show on two devices and a second tab. Only the holder broadcasts; the other reaches the supplied takeover state without starting its camera.
2. Move the show, then move it back. Old tracks stop, the new publisher uses the same UID, stale controls return 409, and buyers' auction timers/chat/notes continue.
3. Try starting another show for that seller. Confirm the error names the live show and neither show is silently cancelled.
4. Hide the active host, then take over before the grace deadline. The obsolete job must not end the resumed show.
5. Check Auto steps down and recovers on a weak connection; no quality picker appears. Check the tip and photo confirmations.
6. Leave buyer and seller tabs open across a later deploy. Refresh waits for sheets/payments/bids and for a live seller to finish; safe idle/route transitions then load the new build. Verify static response headers in Render.

_Generated by [Codex](https://openai.com/codex/)_
