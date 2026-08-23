# Booking form backend — setup

The website's booking form posts to a **Google Apps Script Web App**, which saves each
enquiry as a row in **your own Google Sheet** and emails you a notification.

Nothing here runs on your website. `Code.gs` is a copy of the script for version control —
the live copy lives in your Google account.

```
Visitor fills form  →  Apps Script (Google's servers)  →  row in your Google Sheet
   (your website)                                      →  email to your phone
```

**Why this instead of a database:** there is no server to pay for or maintain, and no
`.db` file sitting in your website folder where anyone could download it. The customer
data lives in your Google Drive, where you can sort, filter and export it.

---

## One-time setup (~20 minutes)

### 1. Create the Sheet

1. Go to [sheets.new](https://sheets.new)
2. Name it something like **Shree Govind — Bookings**

The script creates the `Bookings` tab and the header row by itself on the first
submission. You don't need to set up any columns.

### 2. Add the script

1. In that Sheet: **Extensions → Apps Script**
2. Delete the placeholder `function myFunction() {}`
3. Paste the entire contents of [`Code.gs`](Code.gs)
4. At the top, set `NOTIFY_EMAIL` if you want alerts sent somewhere other than the
   Google account you're signed in as. Leaving it as `''` emails that account.
5. Click the **save** icon

### 3. Test it before deploying

1. In the Apps Script toolbar, pick **runSetupTest** from the function dropdown
2. Click **Run**
3. Google asks you to authorise. It warns *"Google hasn't verified this app"* — expected,
   because the app is yours and unpublished. Click **Advanced → Go to (project name) → Allow**
4. Check that all three happened:
   - a **Bookings** tab appeared with a dark blue header row
   - a row reading `TEST - please delete`
   - an email in your inbox

Delete the test row when you are done. If this step works, deployment is the easy part.

### 4. Deploy it

1. **Deploy → New deployment**
2. Click the gear next to "Select type" → choose **Web app**
3. Fill in:
   - **Description:** `Booking form`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` ← **this must be "Anyone", not "Anyone with Google Account"**
4. Click **Deploy**
5. Google asks you to authorise it. It will warn *"Google hasn't verified this app"* —
   that's expected, because the app is yours and unpublished. Click
   **Advanced → Go to (project name) → Allow**.
6. Copy the **Web app URL**. It ends in `/exec`.

### 5. Connect the website

Open [`assets/js/script.js`](../assets/js/script.js), find this line near the booking
form section, and paste your URL in:

```js
const BOOKING_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```

### 6. Test the live form

Open the site, fill in the booking form, submit. Within a few seconds you should see:

- a green confirmation message on the page
- a new row in the `Bookings` sheet
- an email in your inbox

Install the **Gmail app** on your phone so these arrive as push notifications.

---

## Day-to-day use

The `Status` column is filled with `New` on every booking. Change it to `Called`,
`Scheduled` or `Done` as you work through them — it's an ordinary spreadsheet, so
you can also colour rows, add filters, or share it with a technician.

## Changing the script later

Edit the script, then **Deploy → Manage deployments → edit (pencil) → Version: New
version → Deploy**. This keeps the same URL, so the website needs no change.

> If you create a *new deployment* instead, you get a **new URL** and must update
> `BOOKING_ENDPOINT` again. Editing the existing deployment is almost always what you want.

## Limits

Free Google accounts allow roughly 100 emails/day and 20,000 script calls/day —
far beyond what a local service business will use.

## Security notes

- The `/exec` URL is visible in your website's JavaScript. That's unavoidable for a
  static site and is fine: it is **write-only**. Nobody can read your sheet with it.
- The hidden `company` field in the form is a honeypot. Bots fill it, people never see
  it, and the script silently discards those submissions.
- Never paste API keys or passwords into `assets/js/` — anything there is public.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "Booking endpoint is not configured yet" | Step 5 not done — `BOOKING_ENDPOINT` still has the placeholder |
| CORS error in the browser console | "Who has access" is not set to **Anyone**, or the URL doesn't end in `/exec` |
| Rows appear but no email | Daily email quota hit, or `SEND_EMAIL` is `false` |
| Nothing at all happens | Open the Apps Script editor → **Executions** to see the error |
