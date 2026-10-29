# Maa Madurai Catering Calculator

One-page staff tool for quoting catering: size the biryani buckets, starters
and sides for a headcount, then save the enquiry to the owner's Google Sheet.

**Staff link:** <https://navktrowdy.github.io/maa_catering/>

- `index.html` — the whole page
- `apps-script/Code.gs` — Google Apps Script that checks the staff PIN and adds rows to the sheet

The PIN is checked in the Apps Script, never in the page. This repository holds no data.

## Setup (once)

1. Create a Google Sheet, e.g. **MaaMadurai Catering Enquiries**.
2. **Extensions > Apps Script**: replace the sample code with `apps-script/Code.gs`, save.
3. Reload the sheet. In the new **Catering** menu, run **Set up Enquiries sheet**, then **Set staff PIN** (4–8 digits).
4. In Apps Script: **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**. Copy the URL ending in `/exec`.
5. In `index.html`, paste that URL into `const ENQUIRY_ENDPOINT = '';` near the top of the script. Commit and push.

"Anyone" lets the page reach the script without a Google sign-in; every
request still needs the PIN. After 5 wrong PINs, checks pause for 10 minutes.

## Day to day

- Each device remembers the PIN after the first unlock. **Forget the PIN on this device** (bottom of the estimate panel) clears it.
- Saved enquiries get an ID like `MM-0012` and Status **New**; change it to Quoted, Confirmed or Lost in the sheet.
- Change the PIN with **Catering > Set staff PIN**. Staff are asked for the new one on their next save.
- After editing `Code.gs`, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.
