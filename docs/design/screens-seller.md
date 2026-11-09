# LiveCommerce design: Seller studio screen text

Every frame on the "Seller studio" page of the design canvas, as the words on screen. Direction C (Group Chat: clean & warm). Read with `docs/design/design-brief.md`. Full visual files are kept on Paul's Mac in "Livecommerce Build/Livecommerce design".


## Typography & colour tokens

[BRAND] SELLER STUDIO · FOUNDATIONS
Typography & colour
[brand]
Colour tokens
primary
#10734F · actions
accent
#5A45C2 · tags, shows
surface
#FFFFFF · cards
text
#1D2A24
success
#1D7A3E
warning
#8A5200
danger
#C42B43
primary-soft #E3F4EA
accent-soft #EFEAFE
surface-page #FBF8F4
text-muted #5B6660
success-soft #E2F3E8
warning-soft #FFF1D6
danger-soft #FCE8EB
Also: warm / warm-soft (#7A3A0E / #FFF0E3) for shows and schedules, live (#D6304A) for the LIVE badge and Go Live, surface-sunken (#F4EFE8) for inputs, border (#EEE7DE). Every pairing used for text passes 4.5:1. All values live in one file, studio.css.
Type
display · 32
You're set, Tolu!
h1 · 24 Fredoka
Friday Night Figure Drop
h2 · 19 Fredoka
What are you selling?
body · 16 Nunito
Similar items usually go for ₦25,000–₦40,000 (estimate).
small · 14
Ada won · ₦34,500 · Lagos · Lekki
caption · 12 / 800
PICKUP TOMORROW 10:00–12:00
Fredoka for headings, numbers and prices people read at a glance. Nunito for everything else. Nothing below 12px; body never below 16px on phones.
Shape & voice
card 24
input 16
pill · 44 min
How the assistant talks
Short, warm, one idea per message. Offers, never pushes: "Want me to…?"
Drafts, then the seller confirms. Every suggestion has Edit or Undo.
Any AI price says "estimate". No hype words, no exclamation spam.


## Shared components

[BRAND] SELLER STUDIO · FOUNDATIONS
Shared components
Buttons
Publish for ₦32,000
Add to a show
Not now
End show
Publish
Edit all details
Pill shape, 44–56px tall. One primary per screen.
Chips & status
Anime
Manga
Gaming
Official
Replica
Not sure
Active
Draft
Sold out
In a show
● Live
Filter chips (grey), quick replies (green outline), status pills.
Chat bubbles
Looks like a Gojo prize figure. Here's a draft:
box slightly dented
Looking at your photos…
AI: white, left, avatar dot. Seller: green, right.
Editable product card
TITLE · TAP TO EDIT
Gojo Satoru Prize Figure (Boxed)
₦32,000
Fairly Used
Same card buyers see. Every row is a button that edits in place.
Countdown · bid ticker · stock
0:18
₦34,500
@luffy_lagos · 19 bids
↑ ₦1,500 just now
4 of 10 left
6 sold
Ring turns warning colour under 10s, danger under 5s.
Empty state
No orders yet
They'll appear here after your first sale.
Plan a show
Banners & toast
You're offline. Changes are saved and will sync.
Couldn't load orders.
Try again
New order from Ada · ₦34,500
View
Bottom sheet
Used for confirmations, pickers and quick edits. Actions sit at the bottom, in thumb reach.
Cancel
Confirm
Bottom bar (mobile)
Home
Products
Go Live
Orders
Me
Go Live is the raised centre action. Desktop uses a slim top bar with the same five items.


## A1 · Welcome / sign up

[brand]
I have an account
Sell to fans, live.
Set up takes about 2 minutes.
G
Continue with Google
or use email
Your name
Store name
Phone number
+234
10 digits, no 0 at the start. e.g. 803 123 4567
Email
Password
Create my store
By continuing you agree to the Terms and Privacy Policy.


## A2 · Store setup

Do this later
Your store
This is what fans see on your shows.
+
Store photo
A logo or a clear photo of you
Store name
One-line bio
Write it for me
52 / 80
What do you sell? Pick any
Anime
Manga
Comics
Gaming
Trading cards
Cosplay
Continue


## A3 · Pickup address

REQUIRED
Pickup address
Couriers collect your orders from here, so we can quote delivery before buyers pay.
Use my current location
State
Lagos
City / area
Ikeja
Lekki
Yaba
Surulere
Other area…
Street address
Landmark
optional
Save address


## A4 · Get paid

Do this later
Get paid
Where we send your money after each delivery.
Bank
GTBank
Account number
ACCOUNT NAME
TOLULOPE ADEYEMI
Not you? Check the number. Payouts only go to an account in your name.
Yes, that's me
Skipping is fine. We'll remind you before your first payout.


## A5 · Finished

You're set, Tolu.
OtakuHub Lagos is ready. Let's list your first item.
Store and fandoms
Done
Pickup address · Yaba
Done
Bank account
Later
List my first item
Look around first


## A · Loading / error / offline

LOADING
Get paid
Bank
GTBank
▾
Account number
Checking the account name…
This usually takes a few seconds on slow data.
Yes, that's me
ERROR
Sell to fans, live.
Phone number
+234
Drop the 0 at the start: 803 123 4567
Fix it for me
We couldn't find that bank account
Check the 10 digits, or pick a different bank.
Google sign-in didn't finish
Nothing was lost. Try again, or use email below.
Try again
You're offline. Your answers are saved on this phone.
OFFLINE
Pickup address
State
Lagos
▾
City / area
Yaba
▾
Street address
We'll save this the moment you're back online. No need to type it again.
Save when I'm back online
Try now


## B · Home (show scheduled)

[brand]
TA
Evening, Tolu.
NEXT SHOW · FRI 8:00 PM
Friday Night Figure Drop
2
DAYS
04
HRS
6
ITEMS
Preview show
Edit
4 items haven't been in a show yet. Want me to plan one?
Yes, plan it
Not now
Recent listings
See all
Gojo prize figure
₦32,000
In a show
One Piece vol. 1–10
₦45,000
Active
Nezuko plush
₦15,000
Sold out
₦184,000 this month · ₦62,000 ready to withdraw
Home
Products
Go Live
Orders
Me


## B · Focal card by seller state

1 · NO PRODUCTS YET
List your first item
Snap a photo. I'll write the title, description and tags.
Snap a photo
2 · PRODUCTS, NO SHOW
Plan your first show
You have 6 items ready. I can suggest the order and starting bids.
Plan it with me
3 · SHOW SCHEDULED
FRIDAY 8:00 PM · 6 ITEMS
Go live in 2 days
Friday Night Figure Drop · 41 people set a reminder
Preview show
Edit
4 · SHOW IS LIVE
● LIVE
23:41 · 214 watching
You're live
Item 4 of 6 · Gojo prize figure · ₦34,500 top bid
Back to the studio
5 · ORDERS TO SHIP
FROM FRIDAY'S SHOW
3 orders to ship today
Book one pickup for all three. Courier comes to Yaba.
AD
TO
CH
Ship orders


## B · Empty / loading / offline

EMPTY · NEW STORE
Welcome, Tolu.
List your first item
Snap a photo. I'll write the listing for you.
Snap a photo
Tip: list a few items now and we'll plan a show around them later.
Add your bank so you can get paid
Add bank
₦0 so far. Your first sale shows up here.
Home
Products
Go Live
Orders
Me
LOADING
Evening, Tolu.
Loading on a slow connection. Photos come in last.
Home
Products
Go Live
Orders
Me
Offline · showing what we saved 12 min ago
Retry
OFFLINE
Evening, Tolu.
NEXT SHOW · FRI 8:00 PM
Friday Night Figure Drop
You can still check your items. Going live needs a connection.
Check items
I'll be back when you're online.
Take photos now, list later
Home
Products
Go Live
Orders
Me


## B · Home — desktop

[brand]
Home
Products
Orders
Me
Go Live
Evening, Tolu.
NEXT SHOW · FRI 8:00 PM · 6 ITEMS
Friday Night Figure Drop
Go live in 2 days 4 hours. 41 people set a reminder.
Preview show
Edit
+1
4 items haven't been in a show yet. Want me to plan one?
Yes, plan it
Not now
List an item
Drop photos, I'll write it
Recent listings
See all products
Gojo prize figure
₦32,000
In a show
One Piece vol. 1–10
₦45,000
Active
Nezuko plush
₦15,000
Sold out
Demon Slayer cards ×5
₦12,000
Active
CoD controller skin
₦28,000
Draft
₦184,000 this month · ₦62,000 ready to withdraw
Go to money


## C1 · Start

Listing helper
New item
Edit all details
Hi Tolu! What are we selling today?
Snap or drop up to 5 photos. I'll write the listing.
Front, back, and any damage. Plain background helps.
Camera
Gallery
Photos are shrunk before upload to save your data.
Add a note


## C2 · Thinking

Listing helper
looking at your photos…
Edit all details
72%
used once, box slightly dented
3 photos · 0.9 MB
Looking at your photos…
Message


## C3–6 · Draft, questions, price, tweaks

Listing helper
Draft saved
Edit all details
Buyer preview · draft
3 photos · edit
TITLE · EDITING
PRICE
₦32,000 Buy Now · or bid from ₦20,000
Edit
CATEGORY
Figures › Prize figures
Edit
CONDITION
Fairly Used
Edit
DESCRIPTION · JUST UPDATED
Out of the box once, for one photo. He's been sealed back in ever since. Figure is mint; the box has a small dent on one corner (photo 3).
Edit
TAGS
jujutsu kaisen
gojo
prize figure
anime
Edit
Collapse preview
used once, box slightly dented
Looks like a Gojo Satoru prize figure from Jujutsu Kaisen. Here's a draft, pinned above. Tap anything to change it.
How many do you have?
1
2
3+
Is it official merch or a replica?
Official
Replica
Not sure
Similar items usually go for ₦25,000–₦40,000 (estimate). What's your price?
₦15k
usual range · estimate
₦50k
Buy Now price
₦
Also allow auction
Starting bid
₦
Sell instantly at
optional
₦
If someone bids this much, the auction ends and they win.
make the description funnier
Done. It's updated in the preview. Undo
Shorter title
Funnier description
Add the box details
Publish for ₦32,000
Message


## C7 · Published

Listing helper
Published
Publish
It's live in your shop.
Listed
Gojo Satoru Prize Figure, Jujutsu Kaisen (Boxed)
₦32,000
or bid from ₦20,000 · 1 in stock
Add to a show
List another
Friday's show has room for one more. Want it in there, after the One Piece set?
Yes, add it
Not now
Copy link to share


## C · Edit all details

All details
Filled in from your chat
Photos · 3 of 5
+
Drag to reorder. The first photo is the cover.
Title
Category
Figures
▾
Sub-category
Prize figures
▾
Condition
Brand New
Fairly Used
Refurbished
Official or replica
Official
Replica
Not sure
Description
Tags
Buy Now ₦
Stock
Starting bid ₦
Sell instantly ₦
AI price range for this item: ₦25,000–₦40,000 (estimate).
Comes in sizes or colours
For cosplay or T-shirts: add each size with its own stock, e.g. S · 2, M · 3, L · 1.
Package (for delivery quotes)
Weight kg
L cm
W cm
H cm
Estimated from the box in your photos. Check it on a scale if you can.
Save draft
Publish


## C · AI unavailable / offline

Listing helper
Draft saved on this phone
Weak connection. Your photos upload when the signal improves.
demon slayer plush, new
I couldn't read that one. Fill it in here. I kept what you told me.
Title
Category
from note
Condition
from note
Buy Now ₦
Stock
Try the AI again
Save for later
Publish


## C · Listing Agent — desktop

[brand]
Products / New item · draft saved
Edit all details
used once, box slightly dented
Looks like a Gojo Satoru prize figure from Jujutsu Kaisen. The draft is on the right, exactly as buyers will see it. Click anything to change it.
How many do you have?
1
2
3+
Is it official merch or a replica?
Official
Replica
Not sure
make the description funnier
Done, updated on the right. Undo
Shorter title
Funnier description
Add the box details
Message
TITLE
Gojo Satoru Prize Figure, Jujutsu Kaisen (Boxed)
CATEGORY
Figures › Prize figures
Edit
CONDITION
Fairly Used
Edit
DESCRIPTION · JUST UPDATED
Out of the box once, for one photo. He's been sealed back in ever since. Figure is mint; the box has a small dent on one corner (photo 3).
Edit
TAGS
jujutsu kaisen
gojo
prize figure
anime
Edit
Similar items usually go for ₦25,000–₦40,000 (estimate).
Buy Now ₦
Starting bid ₦
Sell instantly ₦
Publish for ₦32,000


## D · Products

Products
All · 12
Ready for a show · 4
Sold out · 2
Drafts · 1
Gojo prize figure
₦32,000
1 left
In a show
One Piece vol. 1–10
₦45,000
2 left
Active
Demon Slayer cards ×5
₦12,000
8 left
Active
Nezuko plush, 25cm
₦15,000
0 left
Sold out
CoD controller skin
₦28,000
3 left
Draft
Marvel Spider-Man #1–6
₦24,000
1 left
Active
List item
Home
Products
Go Live
Orders
Me


## D · Product detail

Product
Edit
1 / 4
Active
In Friday's show · item 3
One Piece Vol. 1–10, English (Viz)
₦45,000
Listed 3 weeks ago · 38 views · 0 sold
Similar sets usually go for ₦35,000–₦42,000 (estimate). Want to try ₦42,000 for Friday?
Set ₦42,000
Keep ₦45,000
In stock
Shows as "2 left" to buyers
−
2
+
CATEGORY
Manga › Box sets
CONDITION
Fairly Used
TYPE
Official
DELIVERY
1.8 kg · 20×14×18 cm
ABOUT
Volumes 1 to 10, read once, spines straight. Romance Dawn to the Arlong Park arc start.
Add to another show
Duplicate
Archive
Ask the helper


## D · Empty / loading / offline

EMPTY
Products
Nothing here yet
Snap a photo of something you want to sell. I'll write the listing.
List your first item
Home
Products
Go Live
Orders
Me
LOADING
Products
Home
Products
Go Live
Orders
Me
Offline · saved copy from 10:42
Retry
ERROR / OFFLINE
Products
Gojo prize figure
₦32,000
Photo waiting for signal
Nezuko plush
Not uploaded yet
Stock change didn't save
Gojo prize figure: 1 → 2. We'll retry when you're back online.
Retry now
Home
Products
Go Live
Orders
Me


## E1–2 · Pick items & show type

Plan a show
Step 1 of 3 · pick items
Tap what you want to sell. I picked 4 that haven't been in a show yet.
1
Kurama plush · ₦8k
2
Demon Slayer cards
3
One Piece 1–10
4
Gojo prize figure
CoD controller skin
Spider-Man #1–6
What kind of show?
Auction show
Fans bid, highest wins. Best for rare items.
Drop show
Fixed price, limited stock. First to buy wins.
4 items
Next


## E3–4 · AI plan, order, timing, cover

Plan a show
Step 2 of 3 · auction show · 4 items
Here's a first go. Change anything.
Show title
AI
Another idea
Description
AI
Running order
Drag to reorder
Cheap item first to warm up the room. Gojo last, when the most people are watching.
1 · Kurama plush
Starting bid
30s
60s
2 min
2 · Demon Slayer cards ×5
Starting bid
30s
60s
2 min
3 · One Piece vol. 1–10
Starting bid
30s
60s
2 min
4 · Gojo prize figure Headliner
Starting bid
30s
60s
2 min
Starting bids are suggestions based on similar items (estimate).
When?
Go live now
Fri 6 Nov
Sat 7 Nov
Pick a date
7:00 PM
8:00 PM
9:00 PM
Other
Followers get a reminder 1 hour and 15 minutes before.
Cover
Picked by AI
FRI 6 NOV · 8PM
Friday Night Figure Drop
Use another photo
Upload
Next: tell people


## E5 · Promote

Tell people
Step 3 of 3 · promote
I wrote a post for each app. Copy, paste, done.
LIVE · FRI 8PM
Friday Night Figure Drop
Bids from ₦8,000
[brand] · @otakuhub.lagos
Save image
Share
[brand].ng/s/figure-drop
Copy link
Make them shorter
More hype
In Pidgin
TIKTOK
Friday 8PM we're live. Gojo prize figure, One Piece 1–10, Kurama plush. Bids from ₦8k. Link in bio. #anime #jujutsukaisen #lagos
Copy
X / TWITTER
Fri 8PM WAT, live on [brand]: Gojo figure from ₦20k, One Piece vol. 1–10 from ₦30k. If nobody fights you, first bid takes it. [link]
Copy
DISCORD
@everyone show's Friday 8PM. Order: 1) Kurama plush 2) Demon Slayer cards 3) One Piece 1–10 4) Gojo prize figure. Set a reminder: [link]
Copy
WHATSAPP
Hi! I'm going live this Friday 8pm with a Gojo figure, One Piece 1–10 and more. Bids start from ₦8,000. Tap to set a reminder: [link]
Copy
Schedule for Fri 8:00 PM


## E6 · Scheduled

Your show
Scheduled
FRI 6 NOV · 8:00 PM
Friday Night Figure Drop
2
DAYS
04
HRS
12
MINS
Auction show · 4 items
41 reminders set
Edit
Share again
I'll remind you 30 minutes before. You can also go live early if you're ready.
Go live


## E · Empty / loading / error

✕
Plan a show
EMPTY
No items to sell yet
A show needs at least one item. List a few and I'll help you plan it.
List an item
‹
Plan a show
LOADING
Planning your show… working out the order and starting bids.
Skip and set it up myself
Couldn't schedule: you're offline. Saved as a draft.
Retry
‹
Plan a show
ERROR
I couldn't draft the plan this time. I've kept your items in the order you picked them. Fill in the rest, or I can try again.
Show title
Kurama plush
Gojo prize figure
Try the AI again
Continue without AI


## E · Show Planner — desktop

[brand]
Plan a show
Draft saved
Cancel
Schedule · Sat 7 Nov, 6 PM
1 · Pick items
1
2
3
+
Show type
Auction show
Drop show
Fixed price, limited stock. First to tap Buy wins.
2 · The plan
Drafted by AI · all editable
Title
Description
ITEM · DRAG TO REORDER
BUY NOW
QTY
⋮⋮
Demon Slayer cards ×5
⋮⋮
CoD controller skin
⋮⋮
Nezuko plush, 25cm
Prices are based on similar items (estimate). You can change them during the show.
When
Go live now
Sat 7 Nov
6:00 PM
Cover
Picked by AI
Change
3 · Tell people
[brand].ng/s/restock-drop
Copy link
TIKTOK
Saturday 6PM restock drop. Demon Slayer cards ₦12k, Nezuko plush ₦15k. Only 10. #demonslayer #lagos
Copy
X / TWITTER
Sat 6PM WAT: fixed-price drop. CoD controller skins ₦28k, only 3. First tap wins. [link]
Copy
DISCORD
@everyone restock drop Saturday 6PM. Cards, controller skins, Nezuko plush. [link]
Copy
WHATSAPP
Hi! Restock drop this Saturday 6pm. Nezuko plush ₦15,000, only 10. Set a reminder: [link]
Copy


## F · Pre-show check

Ready to go live?
Connection: Good
Camera
Back camera
▾
Mic
Phone mic
▾
FIRST UP · 1 OF 4
Kurama plush · bids from ₦8,000
Change
All good. 41 people will get a "we're live" alert.
Go live


## F · Camera blocked / weak connection

‹
Ready to go live?
We can't see your camera
Allow access in your browser and we'll pick it up.
Tap the lock icon next to the web address
Set Camera and Microphone to Allow
Come back here and tap Try again
Still stuck? Another app might be using the camera. Close it and try again.
Try again
Go live
‹
Ready to go live?
Weak, try Wi-Fi
Your connection is weak
Viewers may see a blurry or frozen picture. Bids still work.
Switch to Wi-Fi if you can
Move closer to a window
Close other apps using data
Save data: lower video quality
Check again
Go live anyway


## G · Live — auction running

● LIVE
214
23:41
End show
Co-host · 2
▴
5 people asked if it's official
Reply "Yes, official"
Hid 1 possible scam: "DM me to pay outside the app"
Undo
@luffy_lagos box get dent?
Ada abeg is it official?
↑ Chidi bid ₦33,000
@tobi.games no wahala, 34!
↑ Ada bid ₦34,500
Up next
+
ITEM 4 OF 6 · AUCTION
₦34,500
Ada winning · 19 bids
0:18
+30s
End now · sell


## G · Live — drop running

● LIVE
198
31:05
End show
Ada has asked about sizes twice
▾
Tobi bought 1
Ada e get the big size?
@luffy_lagos bought 2
Chidi abeg hold one for me
Ngozi bought 1
Up next
+
ITEM 3 OF 4 · BUY NOW DROP
Nezuko plush, 25cm
₦15,000
4 of 10 left
6 sold · ₦90,000
End drop


## G · Item card: ready / sold / not sold

● LIVE
214
25:10
READY
ITEM 5 OF 6 · READY
CoD controller skin
Starting bid ₦18,000 · or Buy Now ₦28,000 ×3
Start auction
Start Buy Now drop
Skip this item
● LIVE
221
24:02
SOLD
Chat is buzzing. Good moment for the next item.
SOLD
Ada won · ₦34,500
Gojo prize figure · 19 bids
Order created
Next item
● LIVE
187
38:44
NOT SOLD
NO BIDS
Spider-Man #1–6
Started at ₦24,000
Try again at ₦18,000? Two people asked about it earlier.
Relist
Skip


## G · Reconnecting

● RECONNECTING
23:58
End show
Reconnecting…
Your viewers are still here. The auction is paused, so no bids are lost.
Trying for 12s · switch to Wi-Fi if you can
AUCTION PAUSED
₦34,500
Ada winning · 19 bids
0:18
The timer restarts from 0:18 when you're back.
Try now
Sell to Ada


## G · Viewer actions & add item

● LIVE
214
26:30
@luffy_lagos 25k for the controller?
Ada do you have the CoD skin in black?
Pin this comment
Reply
Mute Ada for this show
Add from your products
✕
CoD skin, black
₦28,000 · 2 in stock
Add next
Demon Slayer cards ×5
₦12,000 · 8 in stock
Add
Snap a new item


## G · Live Studio — desktop

[brand]
● LIVE
Friday Night Figure Drop
· 214 watching · 23:41
End show
ITEM 4 OF 6 · AUCTION
Gojo prize figure
₦34,500
Ada winning · 19 bids
0:18
+30s
End now · sell
UP NEXT · DRAG TO REORDER
CoD controller skin
Drop · ₦28,000
Spider-Man #1–6
from ₦24,000
+ Add from products
● LIVE
214
5 people asked if it's official
Reply "Yes, official"
Hid 1 possible scam: "DM me to pay outside the app"
Undo
Chat
@luffy_lagos box get dent?
Ada abeg is it official?
↑ Chidi bid ₦33,000
@tobi.games no wahala, 34!
Ngozi delivery to Lekki how much?
↑ Ada bid ₦34,500
Click a name to pin, reply or mute.
Reply in chat


## H · Show recap

Show recap
FRIDAY NIGHT FIGURE DROP · 52 MIN
Nice one, Tolu. You made ₦96,000.
5 of 6
ITEMS SOLD
231
PEAK VIEWERS
+18
FOLLOWERS
Ship orders
Plan next show
What sold
Gojo prize figure
Ada · Lagos, Lekki
₦34,500
One Piece vol. 1–10
@luffy_lagos · Lagos, Yaba
₦31,000
Demon Slayer cards ×5
Chidi · Abuja, Wuse 2
₦12,500
Kurama plush
Tobi · Lagos, Surulere
₦9,000
Nezuko plush
Ada · Lagos, Lekki
₦9,000
Didn't sell
Spider-Man #1–6
Relist in next show
Your Demon Slayer items went fastest, both gone in under a minute.
3 buyers asked for One Piece figures. Consider stocking some for next time.
Top 3 moments
Clips are being prepared
0:24
Share to TikTok
0:15
Share to TikTok
Preparing…
Share to TikTok


## I · Orders

Orders
To ship · 3
Booked · 1
On the way · 2
Delivered · 14
Cancelled · 1
All 3 can go in one pickup from Yaba tomorrow, 10am–12pm. Quotes total ₦7,500.
Book one pickup for all 3
TO SHIP · FROM FRIDAY'S SHOW
Ada · 2 items
Lagos · Lekki · ship by Sun
₦43,500
To ship
@luffy_lagos · 1 item
Lagos · Yaba · ship by Sun
₦31,000
To ship
Chidi · 1 item
Abuja · Wuse 2 · ship by Mon
₦12,500
To ship
BOOKED FOR PICKUP
Tobi · 1 item
Lagos · Surulere · pickup Sat 10–12
₦9,000
Booked
Home
Products
Go Live
Orders
Me


## I · Order detail

Order #A2F-118
From Friday Night Figure Drop
To ship
AD
Ada
Lagos · Lekki Phase 1
Ada won 2 items, so they ship together in one delivery.
Gojo prize figure
Won at auction
₦34,500
Nezuko plush
Buy Now drop
₦9,000
Items
₦43,500
Delivery fee (paid by Ada)
₦2,500
Ada paid
₦46,000
You receive after delivery
₦43,500 − [fee]
Pickup
[Courier partner]
From 14 Herbert Macaulay Way, Yaba
₦2,500
Tomorrow 10–12
Tomorrow 2–4
Book pickup
Print or share label · after booking
Tracking
Paid
Fri 6 Nov, 9:14 PM
Book pickup
You're here
Picked up
On the way
Delivered · money released


## I · Empty / loading / error

EMPTY
Orders
No orders yet
They'll appear here after your first sale.
Plan a show
Home
Products
Go Live
Orders
Me
LOADING
Orders
Booking pickup for 3 orders…
Home
Products
Go Live
Orders
Me
ERROR
Orders
Couldn't book the pickup
The courier has no slots in Yaba tomorrow morning. Your orders are safe, nothing was charged.
Try 2–4pm instead
Pick another day
Buyers get a message if delivery moves by a day. No need to text them yourself.
Home
Products
Go Live
Orders
Me


## I · Orders — desktop

[brand]
Home
Products
Orders
Me
Go Live
Orders
To ship · 3
Booked · 1
On the way · 2
Delivered · 14
Cancelled · 1
All 3 can go in one pickup tomorrow, 10am–12pm. ₦7,500 total.
Book all 3
Ada · 2 items
Lagos · Lekki · ship by Sun
₦43,500
@luffy_lagos · 1 item
Lagos · Yaba · ship by Sun
₦31,000
Chidi · 1 item
Abuja · Wuse 2 · ship by Mon
₦12,500
AD
Ada · Lagos, Lekki Phase 1
Order #A2F-118 · 2 wins combined into one delivery
To ship
Gojo prize figure
₦34,500
Nezuko plush
₦9,000
Items
₦43,500
Delivery (paid by Ada)
₦2,500
Ada paid
₦46,000
[Courier partner] · ₦2,500
Pickup from Yaba · tomorrow 10:00–12:00
Book pickup
Print / share label
Paid
Fri 9:14 PM
Book pickup
You're here
Picked up
On the way
Delivered


## J · Money

Money
READY TO WITHDRAW
₦62,000
Withdraw to GTBank ••6789
₦40,000 pending
released after delivery
Money from a sale is ready 24 hours after the buyer gets their order. Withdrawals reach your bank in minutes, sometimes up to a few hours.
Activity
+
Sale · Tobi
Kurama plush · 7 Nov
+₦9,000
−
Fee
On Tobi's order · 7 Nov
−₦[fee]
+
Sale · @luffy_lagos
One Piece vol. 1–10 · 7 Nov
+₦31,000
↓
Payout to GTBank
31 Oct · sent
−₦75,000
+
Sale · Ngozi
Spider-Man #7–9 · 30 Oct
+₦14,000


## J · Withdraw confirmation

‹
Money
READY TO WITHDRAW
₦62,000
Withdraw ₦62,000?
Amount
All
GT
GTBank ••6789
TOLULOPE ADEYEMI
Change
Transfer fee
₦0
You'll get
₦62,000
Usually arrives in minutes. We'll tell you when it's sent.
Cancel
Withdraw ₦62,000


## J · Empty / withdraw failed

‹
Money
EMPTY
READY TO WITHDRAW
₦0
Your first sale shows up here.
Add your bank before your first payout
It takes a minute. We check the account name for you.
Add bank account
No activity yet
List an item
‹
Money
ERROR
Withdrawal didn't go through
GTBank didn't accept the transfer. Your ₦62,000 is safe and back in your balance.
Try again
Check bank details
READY TO WITHDRAW
₦62,000
This sometimes happens when the bank is busy. Trying again in a few minutes usually works.


## K · Me

OH
OtakuHub Lagos
Prize figures and manga from Yaba. Fridays 8pm live.
Anime
Manga
Gaming
Edit store profile
Pickup address
14 Herbert Macaulay Way, Yaba, Lagos
›
Bank account
GTBank ••6789 · Tolulope Adeyemi
›
Money
₦62,000 ready to withdraw
›
Tell me when…
I get a new order
My show starts in 15 minutes
A payout is sent
Tips from the assistant
At most once a day
Help
›
Sign out
Home
Products
Go Live
Orders
Me


## Notifications · toast & inbox

[brand]
Evening, Tolu.
TOASTS · AUTO-HIDE AFTER 5S
New order from Ada · ₦43,500
View
Ada won the Gojo figure · ₦34,500
Your show starts in 15 min
Get ready
₦62,000 sent to GTBank ••6789
Notifications
Mark all read
TODAY
New order from Ada
2 items · ₦43,500 · ship by Sun
9:14 PM
Auction won · Gojo prize figure
Ada · ₦34,500 · order created
9:02 PM
Show starting in 15 minutes
Friday Night Figure Drop · 41 reminders
7:45 PM
EARLIER
Payout sent · ₦75,000
To GTBank ••6789
31 Oct
4 items haven't been in a show yet
Want me to plan one?
30 Oct
