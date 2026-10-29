/**
 * MaaMadurai catering enquiries — Google Apps Script web app.
 *
 * Paste into Extensions > Apps Script of the enquiries spreadsheet,
 * then deploy as a web app (see SETUP.md). The staff PIN lives in
 * Script Properties and is checked here, never in the web page.
 */
const SHEET_NAME = 'Enquiries';
const HEADERS = [
  'Enquiry ID', 'Logged at', 'Staff', 'Customer name', 'Phone', 'Email',
  'Event date', 'Event type', 'Pickup / delivery', 'Delivery suburb',
  'Guests', 'Vegetarian', 'Appetite', 'Biryani', 'Order lines',
  'Estimated total', 'Per guest', 'Notes', 'Status'
];
const MAX_TRIES = 5;        // wrong PINs allowed...
const LOCK_SECONDS = 600;   // ...before PIN checks pause for 10 minutes

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Catering')
    .addItem('Set staff PIN', 'promptForPin')
    .addItem('Set up Enquiries sheet', 'setupSheet')
    .addToUi();
}

function promptForPin() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Set staff PIN', 'Enter a 4–8 digit PIN for front-of-house staff:', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const pin = res.getResponseText().trim();
  if (!/^\d{4,8}$/.test(pin)) { ui.alert('The PIN must be 4 to 8 digits.'); return; }
  PropertiesService.getScriptProperties().setProperty('STAFF_PIN', pin);
  CacheService.getScriptCache().remove('pin_fails');
  ui.alert('Staff PIN saved. Anyone using the calculator now needs the new PIN.');
}

function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#7d1d0d').setFontColor('#face0b');
  sh.setFrozenRows(1);
  // Keep phone numbers' leading zero and enquiry IDs as typed
  sh.getRange('A:A').setNumberFormat('@');
  sh.getRange('E:E').setNumberFormat('@');
  sh.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('G:G').setNumberFormat('ddd dd/mm/yyyy');
  sh.getRange('P:Q').setNumberFormat('$#,##0.00');
  sh.getRange('O:O').setWrap(true);
  const status = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Quoted', 'Confirmed', 'Lost'], true).build();
  sh.getRange(2, HEADERS.length, sh.getMaxRows() - 1, 1).setDataValidation(status);
  return sh;
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad_request' }); }
  const check = checkPin(String(body.pin || ''));
  if (!check.ok) return json(check);
  if (body.action === 'verify') return json({ ok: true });
  if (body.action === 'save') return json(saveEnquiry(body.enquiry || {}));
  return json({ ok: false, error: 'unknown_action' });
}

function doGet() {
  return json({ ok: true, service: 'MaaMadurai catering enquiries' });
}

function checkPin(pin) {
  const stored = PropertiesService.getScriptProperties().getProperty('STAFF_PIN');
  if (!stored) return { ok: false, error: 'pin_not_set' };
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('pin_fails') || 0);
  if (fails >= MAX_TRIES) return { ok: false, error: 'locked' };
  if (pin !== stored) {
    cache.put('pin_fails', String(fails + 1), LOCK_SECONDS);
    return { ok: false, error: 'bad_pin' };
  }
  cache.remove('pin_fails');
  return { ok: true };
}

function saveEnquiry(q) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(SHEET_NAME) || setupSheet();
    const id = 'MM-' + String(sh.getLastRow()).padStart(4, '0');
    sh.appendRow([
      id, new Date(), clean(q.staff), clean(q.name), clean(q.phone), clean(q.email),
      q.eventDate ? new Date(q.eventDate + 'T00:00:00') : '', clean(q.eventType),
      clean(q.fulfilment), clean(q.suburb), num(q.guests), num(q.veg), clean(q.appetite),
      clean(q.biryani), clean(q.lines), num(q.total), num(q.perGuest), clean(q.notes), 'New'
    ]);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

// Text from the page must never be read as a spreadsheet formula
function clean(v) {
  const s = String(v == null ? '' : v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function num(v) {
  const n = Number(v);
  return isFinite(n) ? n : '';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
