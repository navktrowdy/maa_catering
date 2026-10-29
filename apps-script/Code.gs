/**
 * MaaMadurai catering enquiries — Google Apps Script web app.
 *
 * Works whether the script is attached to the spreadsheet or standalone:
 * it opens the sheet by SPREADSHEET_ID. Deploy as a web app (see README.md).
 *
 * PINs live in Script Properties and are checked here, never in the web page:
 *   STAFF_PIN    — unlocks the calculator and saves enquiries
 *   MANAGER_PIN  — approves discounts over DISCOUNT_LIMIT percent
 * Set them in Project Settings > Script properties, or with the Catering menu
 * when the script is attached to the sheet.
 */
const SPREADSHEET_ID = '1ECXOxZxKnebCgnlqfLN0YcrzPPZFXbcrg04YN-IoDmA';
const SHEET_NAME = 'Enquiries';
const HEADERS = [
  'Enquiry ID', 'Logged at', 'Staff', 'Customer name', 'Phone', 'Email',
  'Event date', 'Event time', 'Event type', 'Pickup / delivery', 'Delivery suburb',
  'Guests', 'Vegetarian', 'Children', 'Biryani', 'Order lines',
  'Subtotal', 'Discount %', 'Discount', 'Manager approved', 'Total', 'Per guest',
  'Notes', 'Status'
];
const DISCOUNT_LIMIT = 5;   // staff may give up to this percent without a manager
const MAX_TRIES = 5;        // wrong PINs allowed...
const LOCK_SECONDS = 600;   // ...before checks pause for 10 minutes

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Catering')
    .addItem('Set staff PIN', 'promptForStaffPin')
    .addItem('Set manager PIN', 'promptForManagerPin')
    .addItem('Set up Enquiries sheet', 'setupSheet')
    .addToUi();
}

function promptForStaffPin() { promptForPin('STAFF_PIN', 'staff', 'pin_fails'); }
function promptForManagerPin() { promptForPin('MANAGER_PIN', 'manager', 'mgr_fails'); }

function promptForPin(key, who, failKey) {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Set ' + who + ' PIN', 'Enter a 4–8 digit ' + who + ' PIN:', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const pin = res.getResponseText().trim();
  if (!/^\d{4,8}$/.test(pin)) { ui.alert('The PIN must be 4 to 8 digits.'); return; }
  PropertiesService.getScriptProperties().setProperty(key, pin);
  CacheService.getScriptCache().remove(failKey);
  ui.alert('The ' + who + ' PIN is saved.');
}

function book() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setupSheet() {
  const ss = book();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getMaxColumns() < HEADERS.length) sh.insertColumnsAfter(sh.getMaxColumns(), HEADERS.length - sh.getMaxColumns());
  // Clear formats left by an older column layout before applying this one
  sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearDataValidations().setNumberFormat('General');
  sh.getRange(1, 1, 1, sh.getMaxColumns()).clearContent();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#7d1d0d').setFontColor('#face0b');
  sh.setFrozenRows(1);
  const col = name => HEADERS.indexOf(name) + 1;
  const fmt = (name, f) => sh.getRange(2, col(name), sh.getMaxRows() - 1, 1).setNumberFormat(f);
  // Keep IDs, phone numbers' leading zero and times as typed
  ['Enquiry ID', 'Phone', 'Event time'].forEach(n => fmt(n, '@'));
  fmt('Logged at', 'dd/mm/yyyy hh:mm');
  fmt('Event date', 'ddd dd/mm/yyyy');
  ['Subtotal', 'Discount', 'Total', 'Per guest'].forEach(n => fmt(n, '$#,##0.00'));
  fmt('Discount %', '0.##"%"');
  sh.getRange(2, col('Order lines'), sh.getMaxRows() - 1, 1).setWrap(true);
  const status = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Quoted', 'Confirmed', 'Lost'], true).build();
  sh.getRange(2, col('Status'), sh.getMaxRows() - 1, 1).setDataValidation(status);
  return sh;
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad_request' }); }
  const check = checkPin('STAFF_PIN', 'pin_fails', String(body.pin || ''), 'pin_not_set', 'bad_pin', 'locked');
  if (!check.ok) return json(check);
  if (body.action === 'verify') return json({ ok: true });
  if (body.action === 'approve') return json(checkManager(body.managerPin));
  if (body.action === 'save') return json(saveEnquiry(body.enquiry || {}));
  return json({ ok: false, error: 'unknown_action' });
}

function doGet() {
  return json({ ok: true, service: 'MaaMadurai catering enquiries' });
}

function checkManager(pin) {
  return checkPin('MANAGER_PIN', 'mgr_fails', String(pin || ''), 'manager_pin_not_set', 'bad_manager_pin', 'manager_locked');
}

function checkPin(key, failKey, pin, notSet, bad, locked) {
  const stored = PropertiesService.getScriptProperties().getProperty(key);
  if (!stored) return { ok: false, error: notSet };
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_TRIES) return { ok: false, error: locked };
  if (pin !== stored) {
    cache.put(failKey, String(fails + 1), LOCK_SECONDS);
    return { ok: false, error: bad };
  }
  cache.remove(failKey);
  return { ok: true };
}

function saveEnquiry(q) {
  const pct = Math.min(100, Math.max(0, Number(q.discountPct) || 0));
  let approved = '';
  if (pct > DISCOUNT_LIMIT) {
    const mgr = checkManager(q.managerPin);
    if (!mgr.ok) return { ok: false, error: mgr.error === 'bad_manager_pin' ? 'approval_required' : mgr.error };
    approved = 'Yes';
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let sh = book().getSheetByName(SHEET_NAME);
    const headersMatch = sh && sh.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') === HEADERS.join('|');
    if (!sh || (!headersMatch && sh.getLastRow() <= 1)) sh = setupSheet();
    const id = 'MM-' + String(sh.getLastRow()).padStart(4, '0');
    sh.appendRow([
      id, new Date(), clean(q.staff), clean(q.name), clean(q.phone), clean(q.email),
      q.eventDate ? new Date(q.eventDate + 'T00:00:00') : '', clean(q.eventTime), clean(q.eventType),
      clean(q.fulfilment), clean(q.suburb), num(q.guests), num(q.veg), num(q.kids),
      clean(q.biryani), clean(q.lines), num(q.subtotal), pct, num(q.discount), approved,
      num(q.total), num(q.perGuest), clean(q.notes), 'New'
    ]);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

// Text from the page must never be read as a spreadsheet formula
function clean(v) {
  const s = String(v == null ? '' : v).slice(0, 4000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function num(v) {
  const n = Number(v);
  return isFinite(n) ? n : '';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
