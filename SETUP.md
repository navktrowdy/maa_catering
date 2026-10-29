# MaaMadurai Catering Calculator — staff setup

A front-of-house tool for quoting catering. Staff unlock it with a PIN, size
the order, and save each enquiry as a row in a Google Sheet.

- `catering-calculator.html` — the calculator page
- `apps-script/Code.gs` — the Google Apps Script that checks the PIN and writes to the sheet

The PIN is stored and checked in the Apps Script, never in the web page, so
it can't be read from the page source and nobody can write to the sheet
without it.

## 1. Create the spreadsheet

1. Create a new Google Sheet, e.g. **MaaMadurai Catering Enquiries**.
2. Open **Extensions > Apps Script**, delete the sample code, paste the whole of
   `apps-script/Code.gs`, and save.
3. Back in the sheet, reload the page. A **Catering** menu appears.
4. **Catering > Set up Enquiries sheet** (approve the permissions prompt the first time).
5. **Catering > Set staff PIN** and enter a 4–8 digit PIN.

## 2. Deploy the web app

1. In Apps Script: **Deploy > New deployment**, type **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy and copy the **Web app URL** (ends in `/exec`).

"Anyone" lets the page reach the script without a Google sign-in; every
request still needs the staff PIN. After 5 wrong PINs, PIN checks pause for
10 minutes.

## 3. Connect the page

Open `catering-calculator.html`, find this line near the top of the script:

```js
const ENQUIRY_ENDPOINT = '';
```

and paste the web app URL between the quotes. Then host the page (GitHub
Pages works) or open it on the front-counter device.

## Day to day

- The page locks itself after 20 minutes of no use, and when the browser tab is closed. **Lock** locks it straight away.
- Each saved enquiry gets an ID such as `MM-0012` and a **Status** of New. Update it to Quoted, Confirmed or Lost in the sheet.
- To change the PIN: **Catering > Set staff PIN** in the sheet. Staff are asked for the new PIN on their next save or unlock.
- If you edit `Code.gs` later, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.
