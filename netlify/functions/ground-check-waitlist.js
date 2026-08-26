// Netlify Function: syncs Ground Check waitlist signups to Notion.
//
// Called client-side (see blog/the-plan-the-route.html) alongside the native
// Netlify Forms submission. Netlify Forms remains the backup/raw record in
// the Netlify dashboard; this function writes the record Katie actually
// checks — the "Ground Check — Waitlist" database in Notion.
//
// REQUIRED SETUP (not done by this code — see PR/commit notes):
//   1. In Notion, create an internal integration and copy its secret token.
//   2. Share the "Ground Check — Waitlist" database with that integration.
//   3. In the Netlify site's dashboard, add an environment variable:
//        NOTION_TOKEN = <the integration secret>
//      Never commit this token to the repo.
//
// Optional env override:
//   NOTION_DATA_SOURCE_ID — defaults to the "Ground Check — Waitlist" data
//   source confirmed at build time (75a46d10-9309-46c9-b902-b69448bea22b).

const DEFAULT_DATA_SOURCE_ID = '75a46d10-9309-46c9-b902-b69448bea22b';
const NOTION_VERSION = '2025-09-03';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error('ground-check-waitlist: NOTION_TOKEN is not configured');
    return { statusCode: 500, body: JSON.stringify({ error: 'Notion sync is not configured yet.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const source = payload.source || 'Blog article';

  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name and email are required.' }) };
  }

  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID || DEFAULT_DATA_SOURCE_ID;
  const submittedDate = new Date().toISOString().slice(0, 10);

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { type: 'data_source_id', data_source_id: dataSourceId },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Email: { email: email },
          Source: { select: { name: source } },
          Submitted: { date: { start: submittedDate } },
          Status: { select: { name: 'New' } },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ground-check-waitlist: Notion API error', response.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to sync to Notion.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('ground-check-waitlist: unexpected error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error syncing to Notion.' }) };
  }
};
