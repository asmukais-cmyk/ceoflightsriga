/**
 * Vercel Serverless Function — TestGorilla Invite by Email
 *
 * POST /api/invite
 * Body: { firstName, lastName, email }
 * Returns: { redirectUrl } — direct link to the assessment
 *
 * Flow:
 *  1. Authenticate with TestGorilla (login → token)
 *  2. Invite candidate with no_email=true (suppress TG email)
 *  3. Fetch candidature details to get the invitation_link
 *  4. Return the direct assessment URL
 */

const TG_BASE = 'https://app.testgorilla.com';
const ASSESSMENT_ID = process.env.TG_ASSESSMENT_ID || '1547206';

// Cache the auth token in-memory (survives within the same Lambda warm instance)
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  // Reuse cached token for up to 50 minutes
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const username = process.env.TG_USERNAME;
  const password = process.env.TG_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing TG_USERNAME or TG_PASSWORD environment variables');
  }

  const res = await fetch(`${TG_BASE}/api/profiles/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': TG_BASE,
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TestGorilla login failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 min
  return cachedToken;
}

async function inviteCandidate(token, { firstName, lastName, email }) {
  const url = `${TG_BASE}/api/assessments/${ASSESSMENT_ID}/invite_candidate/?no_email=true`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!res.ok) {
    const text = await res.text();

    // Handle duplicate candidate — already invited
    if (res.status === 400 && text.includes('already')) {
      return { duplicate: true, raw: text };
    }

    throw new Error(`Invite failed (${res.status}): ${text}`);
  }

  return await res.json();
}

async function getInvitationLink(token, testtakerId) {
  // Fetch candidature details to get the invitation_link
  const url = `${TG_BASE}/api/assessments/candidature/?assessment=${ASSESSMENT_ID}&test_taker=${testtakerId}&limit=1`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch candidature (${res.status})`);
  }

  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const candidature = data.results[0];
    // The invitation_link field contains the direct URL
    if (candidature.invitation_link) {
      return candidature.invitation_link;
    }
    // Fallback: construct from invitation_uuid
    if (candidature.invitation_uuid) {
      return `${TG_BASE}/testtaker/welcome/${candidature.invitation_uuid}`;
    }
  }

  throw new Error('Could not retrieve invitation link from candidature');
}

async function findExistingCandidate(token, email) {
  // Search for existing candidature by email
  const url = `${TG_BASE}/api/assessments/candidature/?assessment=${ASSESSMENT_ID}&search=${encodeURIComponent(email)}&limit=5`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.results && data.results.length > 0) {
    // Find exact email match
    const match = data.results.find(
      (c) => c.email && c.email.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      return match.invitation_link ||
        (match.invitation_uuid ? `${TG_BASE}/testtaker/welcome/${match.invitation_uuid}` : null);
    }
  }

  return null;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email } = req.body;

    // Validation
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ error: 'Last name is required' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    // Step 1: Authenticate
    const token = await getToken();

    // Step 2: Invite the candidate (suppress email)
    const inviteResult = await inviteCandidate(token, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
    });

    let redirectUrl;

    if (inviteResult.duplicate) {
      // Candidate already exists — find their existing link
      redirectUrl = await findExistingCandidate(token, email.trim().toLowerCase());
      if (!redirectUrl) {
        return res.status(400).json({
          error: 'You have already been invited to this assessment. Please check your email for the original invitation link.',
        });
      }
    } else {
      // Step 3: Get the personalized assessment link
      const testtakerId = inviteResult.testtaker_id;

      if (!testtakerId) {
        // Try using invitation_uuid directly
        if (inviteResult.invitation_uuid) {
          redirectUrl = `${TG_BASE}/testtaker/welcome/${inviteResult.invitation_uuid}`;
        } else {
          throw new Error('No testtaker_id or invitation_uuid in invite response');
        }
      } else {
        redirectUrl = await getInvitationLink(token, testtakerId);
      }
    }

    return res.status(200).json({ redirectUrl });
  } catch (err) {
    console.error('Invite error:', err);

    // If token expired, clear cache
    if (err.message && err.message.includes('401')) {
      cachedToken = null;
      tokenExpiry = 0;
    }

    return res.status(500).json({
      error: 'Something went wrong. Please try again or contact HR@ceoflights.com',
    });
  }
}
