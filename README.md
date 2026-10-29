# Maa Madurai Catering Calculator

One-page staff tool for quoting catering: size the biryani buckets, starters
and sides for a headcount, then save the enquiry to the owner's Google Sheet.

**Staff link:** <https://navktrowdy.github.io/maa_catering/>

- `index.html` — the whole page
- `apps-script/Code.gs` — Google Apps Script that checks the staff PIN and adds rows to the sheet

The PIN is checked in the Apps Script, never in the page. This repository holds no data.

## Setup (once)

1. Create a Google Sheet and put its ID in `SPREADSHEET_ID` at the top of `apps-script/Code.gs`.
2. Create an Apps Script project (from the sheet's **Extensions > Apps Script**, or at script.google.com) and paste in `Code.gs`. Save.
3. Set the PINs: **Project Settings** (gear icon) **> Script properties > Add script property**:
   - `STAFF_PIN` — 4–8 digits, for front-of-house staff
   - `MANAGER_PIN` — 4–8 digits, approves discounts over 5%

   (If the script was made from the sheet, the sheet also gets a **Catering** menu to set them.)
4. **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**. Copy the URL ending in `/exec`.
5. In `index.html`, paste that URL into `const ENQUIRY_ENDPOINT = '';` near the top of the script. Commit and push.

"Anyone" lets the page reach the script without a Google sign-in; every
request still needs the PIN. After 5 wrong PINs, checks pause for 10 minutes.

## Day to day

- Each device remembers the PIN after the first unlock. **Forget the PIN on this device** (bottom of the estimate panel) clears it.
- Saved enquiries get an ID like `MM-0012` and Status **New**; change it to Quoted, Confirmed or Lost in the sheet.
- The **Enquiries** tab is created and formatted automatically on the first save.
- Staff can give up to 5% discount. Above that, a manager enters their PIN on the page to approve it; the sheet records the discount and **Manager approved: Yes**. The limit is `DISCOUNT_LIMIT` in both `index.html` and `Code.gs`.
- **Copy WhatsApp quote** copies a plain-text quote with no per-item prices. The **Kitchen prep quantities** panel (meat, rice, starters, gravies, pre-order reminders) is for staff and is never copied.
- Group pricing: base rates are for under 30 guests; food is 2% off for 30–39, 5% off for 40–49 and 10% off for 50+ (`GROUP_RATES`). Packaging is not reduced. This is separate from the staff discount.
- The menu runs Biryani, Starters, Desserts, Tiffin, then Gravies & sides and Drinks. Every item starts **Off**; adding a quantity switches it On, and switching an empty item On fills a starting quantity. Off keeps the quantity. Packaging has its own switch. **Other items** lets staff price anything not on the list.
- Prices are hidden while the order is built. **Review & confirm order** shows the guests, date and items for a final check; confirming reveals the prices and total and unlocks Copy and Save. Changing anything that affects the price hides them again until it is re-confirmed.
- Catering rates live in the `ADDONS` list near the top of the script in `index.html`. Prep assumptions (grams per head, 5% buffer, 4 L per gravy batch) are in `PREP`.
- Change a PIN by editing it in Script properties. Staff are asked for the new one on their next save.
- After editing `Code.gs`, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.
