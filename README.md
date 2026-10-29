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
3. Set the PIN: **Project Settings** (gear icon) **> Script properties > Add script property**, property `STAFF_PIN`, value 4–8 digits. Save.
   (If the script was made from the sheet, the sheet also gets a **Catering > Set staff PIN** menu.)
4. **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**. Copy the URL ending in `/exec`.
5. In `index.html`, paste that URL into `const ENQUIRY_ENDPOINT = '';` near the top of the script. Commit and push.

"Anyone" lets the page reach the script without a Google sign-in; every
request still needs the PIN. After 5 wrong PINs, checks pause for 10 minutes.

## Day to day

- Each device remembers the PIN after the first unlock. **Forget the PIN on this device** (bottom of the estimate panel) clears it.
- Saved enquiries get an ID like `MM-0012` and Status **New**; change it to Quoted, Confirmed or Lost in the sheet.
- The **Enquiries** tab is created and formatted automatically on the first save.
- Change the PIN by editing `STAFF_PIN` in Script properties. Staff are asked for the new one on their next save.
- After editing `Code.gs`, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.
