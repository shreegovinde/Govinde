/**
 * Shree Govind Enterprise — booking form endpoint
 * ------------------------------------------------
 * This file does NOT run on your website. It runs on Google's servers.
 * Paste it into Extensions -> Apps Script inside your Google Sheet,
 * then deploy it as a Web App. See backend/README.md for the exact steps.
 *
 * What it does on every form submission:
 *   1. Appends a row to the "Bookings" sheet
 *   2. Emails you the enquiry so your phone buzzes
 */

// ---------- Settings ----------

// Tab name inside the spreadsheet. Created automatically if missing.
var SHEET_NAME = 'Bookings';

// Where to send the notification. Leave '' to email the Google account
// that owns this script.
var NOTIFY_EMAIL = '';

// Set to false if you only want rows in the sheet and no emails.
var SEND_EMAIL = true;

var COLUMNS = [
  'Timestamp',
  'Name',
  'Phone',
  'Service',
  'Preferred Date',
  'Area / Address',
  'Message',
  'Status'
];

// ---------- Endpoint ----------

/**
 * Handles the POST from the website's booking form.
 */
function doPost(e) {
  // One submission at a time, so two people booking at once cannot
  // overwrite each other's row.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var data = (e && e.parameter) || {};

    // Honeypot: real visitors never see this field, bots fill it in.
    // Return success so the bot does not retry.
    if (data.company) {
      return jsonResponse({ ok: true });
    }

    if (!data.name || !data.phone || !data.service) {
      return jsonResponse({ ok: false, error: 'Name, phone and service are required.' });
    }

    var booking = {
      name: String(data.name).trim(),
      // Leading apostrophe keeps Sheets from mangling the number
      phone: "'" + String(data.phone).trim(),
      service: String(data.service).trim(),
      date: data.date ? String(data.date).trim() : '',
      address: data.address ? String(data.address).trim() : '',
      message: data.message ? String(data.message).trim() : ''
    };

    getSheet().appendRow([
      new Date(),
      booking.name,
      booking.phone,
      booking.service,
      booking.date,
      booking.address,
      booking.message,
      'New'
    ]);

    if (SEND_EMAIL) {
      sendNotification(booking);
    }

    return jsonResponse({ ok: true });

  } catch (err) {
    // Logged under Executions in the Apps Script editor
    console.error(err);
    return jsonResponse({ ok: false, error: 'Could not save the booking.' });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Lets you confirm the deployment is live by opening the URL in a browser.
 */
function doGet() {
  return jsonResponse({ ok: true, message: 'Shree Govind booking endpoint is live.' });
}

// ---------- Setup test ----------

/**
 * Run this ONCE from the Apps Script editor before deploying.
 *
 * Select 'runSetupTest' in the toolbar dropdown and click Run. It will:
 *   1. Ask you to authorise the script (expected the first time)
 *   2. Write a test row into the Bookings sheet
 *   3. Send you the notification email
 *
 * If all three happen, the script works and you can move on to deploying it.
 * Delete the test row from the sheet afterwards.
 */
function runSetupTest() {
  var result = doPost({
    parameter: {
      name: 'TEST - please delete',
      phone: '9075862702',
      service: 'AC Service / Wet Cleaning',
      date: '2026-01-01',
      address: 'Kasheli, Thane',
      message: 'This is a test row created by runSetupTest().'
    }
  });

  var response = result.getContent();
  Logger.log(response);

  if (response.indexOf('"ok":true') === -1) {
    throw new Error('Setup test failed: ' + response);
  }

  Logger.log('Setup test passed. Check the Bookings sheet and your inbox.');
  Logger.log('Notifications will go to: ' + (NOTIFY_EMAIL || Session.getEffectiveUser().getEmail()));
}

// ---------- Helpers ----------

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }

  // First run: lay down the header row and freeze it
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length)
      .setFontWeight('bold')
      .setBackground('#112a46')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(7, 320);
  }

  return sheet;
}

function sendNotification(booking) {
  var to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;

  var problem = booking.message || '(not described)';
  var phone = booking.phone.replace(/^'/, '');

  // The problem goes in the subject too, so it shows in the phone
  // notification preview without having to open the mail.
  var subject = 'New booking: ' + booking.name + ' - ' + booking.service
    + ' - ' + truncate(problem, 45);

  // Contact details first, then what needs fixing
  var lines = [
    'Call back:  ' + phone,
    'Name:       ' + booking.name,
    'Service:    ' + booking.service,
    'Preferred:  ' + (booking.date || 'Not specified'),
    'Area:       ' + (booking.address || 'Not specified'),
    '',
    '----------------------------------------',
    '',
    'PROBLEM',
    problem,
    '',
    '----------------------------------------',
    '',
    'All bookings:',
    SpreadsheetApp.getActiveSpreadsheet().getUrl()
  ];

  MailApp.sendEmail(to, subject, lines.join('\n'));
}

/**
 * Shortens text for the subject line without cutting a word in half.
 */
function truncate(text, limit) {
  var clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;

  var cut = clean.slice(0, limit);
  var lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > limit * 0.6) cut = cut.slice(0, lastSpace);

  return cut + '...';
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
