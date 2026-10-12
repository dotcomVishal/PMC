const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'pmc-learning-fest-secret-key-2026';

// Locate service account key
const possibleKeyPaths = [
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  path.join(__dirname, 'serviceaccountkey.json'),
  path.join(__dirname, '..', 'serviceaccountkey.json'),
  '/app/serviceaccountkey.json'
].filter(Boolean);

let keyPath = possibleKeyPaths.find(p => fs.existsSync(p));

if (keyPath) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log(`Firebase Admin initialized successfully using: ${keyPath}`);
  } catch (err) {
    console.error('Error initializing Firebase Admin:', err);
  }
} else {
  console.warn('WARNING: No serviceaccountkey.json found in possible paths:', possibleKeyPaths);
}

// Configured admin emails
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'b25339@students.iitmandi.ac.in')
  .toLowerCase()
  .split(',')
  .map(e => e.trim());

// Token utilities using native crypto
function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 3600); // 30 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyCustomToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Verify Token Middleware (Supports both custom institute tokens & Firebase tokens)
async function verifyToken(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
  }
  let email, name, rollNumber, isAdmin;

  // 1. Check custom token first
  const customPayload = verifyCustomToken(token);
  if (customPayload && customPayload.email) {
    email = customPayload.email.toLowerCase();
    name = customPayload.name || email.split('@')[0].toUpperCase();
    rollNumber = customPayload.rollNumber || email.split('@')[0].toUpperCase();
  } else {
    // 2. Fall back to Firebase Admin ID token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      email = (decodedToken.email || '').toLowerCase();
      rollNumber = email.split('@')[0].toUpperCase();
      name = decodedToken.name || rollNumber;
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
  }

  // Domain check: only @students.iitmandi.ac.in and @iitmandi.ac.in allowed
  if (!email.endsWith('@students.iitmandi.ac.in') && !email.endsWith('@iitmandi.ac.in')) {
    return res.status(403).json({
      error: 'Access restricted: Only @students.iitmandi.ac.in or @iitmandi.ac.in emails are allowed.'
    });
  }

  isAdmin = ADMIN_EMAILS.includes(email);

  req.user = {
    email,
    name,
    rollNumber,
    isAdmin
  };

  next();
}

// Require Admin Middleware
function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

module.exports = {
  admin,
  signToken,
  verifyToken,
  verifyAdmin,
  ADMIN_EMAILS
};
