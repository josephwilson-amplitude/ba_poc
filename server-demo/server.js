'use strict';

const path        = require('path');
const express     = require('express');
const cookieParser = require('cookie-parser');
const { Experiment } = require('@amplitude/experiment-node-server');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT         = 3000;
const FLAG_KEY     = 'new-search-experience-server';

// Server-side deployment key — get this from Amplitude:
// Experiment → Deployments → create a "server" deployment → copy secret key
// Starts with "server-..."  NOT the client key used in the browser
const SERVER_KEY = process.env.AMPLITUDE_SERVER_KEY || 'server-7b4xYsMq6sr1lpojitsRzlnilNFpcJiQ';

const ANALYTICS_KEY = 'f70ef2dbfa2b6bfc6316397d090f6b16'; // same as browser

// ── Amplitude Experiment clients ──────────────────────────────────────────────
//
// LOCAL eval — SDK downloads flag rules once at startup, evaluates in-process.
// Zero network calls per request; evaluation takes ~microseconds.
//
const localClient = Experiment.initializeLocal(SERVER_KEY, {
  serverUrl: 'https://flag.lab.eu.amplitude.com',
  flagConfigPollingIntervalMillis: 30_000,
  debug: true
});

//
// REMOTE eval — SDK sends user context to Amplitude servers per request.
// One network call per request; evaluation takes ~10–50 ms.
//
const remoteClient = Experiment.initialize(SERVER_KEY, {
  serverZone: 'EU',
  fetchTimeoutMillis: 3000,
  retryFetchOnFailure: false
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await localClient.start();
    console.log('[local]  Flag rules loaded — ready for in-process evaluation');
  } catch (err) {
    console.warn('[local]  Could not load flag rules:', err.message);
    console.warn('         Check AMPLITUDE_SERVER_KEY is set to a valid server key.');
  }

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(cookieParser());

  // Serve server-specific assets first, fall through to shared docs assets
  app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
  app.use('/assets', express.static(path.join(__dirname, '../docs/assets')));

  // ── Debug route — shows all downloaded flag rules ──────────────────────────
  app.get('/debug', async (req, res) => {
    const user = { user_id: 'debug-user' };
    const all  = await localClient.evaluate(user);

    // Also hit the raw Amplitude flags API to see what's returned for this key
    let rawApi = null;
    let rawApiWithMode = null;
    try {
      const resp = await fetch('https://flag.lab.eu.amplitude.com/sdk/v2/flags?v=0', {
        headers: { 'Authorization': `Api-Key ${SERVER_KEY}` }
      });
      rawApi = await resp.json();
    } catch (e) {
      rawApi = { error: e.message };
    }
    try {
      const resp = await fetch('https://flag.lab.eu.amplitude.com/sdk/v2/flags?v=0&evaluationMode=local', {
        headers: { 'Authorization': `Api-Key ${SERVER_KEY}` }
      });
      rawApiWithMode = await resp.json();
    } catch (e) {
      rawApiWithMode = { error: e.message };
    }

    res.json({
      downloaded_flags: Object.keys(all),
      evaluated: all,
      target_flag: FLAG_KEY,
      found: !!all[FLAG_KEY],
      raw_api_no_filter: rawApi,
      raw_api_with_evaluationMode_local: rawApiWithMode
    });
  });

  // ── Main route ─────────────────────────────────────────────────────────────
  app.get('/', async (req, res) => {
    // mode: 'local' (default) or 'remote'
    const mode = req.query.mode === 'remote' ? 'remote' : 'local';

    // preview override for demo purposes (mirrors client-side panel buttons)
    const previewVariant = req.query.variant; // 'control' | 'treatment' | undefined

    // Stable user ID — persist across refreshes via cookie
    let userId = req.cookies.ba_demo_uid;
    if (!userId) {
      userId = 'demo_' + Math.random().toString(36).slice(2, 10);
    }

    const user = { user_id: userId };

    let variant     = 'control';
    let evalTimeUs  = null;
    let networkCalls = 0;
    let evalError   = null;
    let rawResponse = null;

    if (previewVariant && (previewVariant === 'control' || previewVariant === 'treatment')) {
      variant = previewVariant;
      evalTimeUs   = 0;
      networkCalls = 0;
      rawResponse  = { [FLAG_KEY]: { key: previewVariant, value: previewVariant, source: 'preview-override' } };
    } else if (mode === 'local') {
      // Local evaluation — in-process against cached flag rules
      const t0 = process.hrtime.bigint();
      try {
        const variants = await localClient.evaluate(user, [FLAG_KEY]);
        const t1 = process.hrtime.bigint();
        evalTimeUs  = Number(t1 - t0) / 1000;   // nanoseconds → microseconds
        networkCalls = 0;

        const v = variants[FLAG_KEY];
        variant     = (v && v.value) ? v.value : 'control';
        rawResponse = { [FLAG_KEY]: v || { key: 'control', value: 'control', source: 'default' } };
      } catch (err) {
        evalError = err.message;
        console.warn('[local] evaluate error:', err.message);
      }
    } else {
      // Remote evaluation — async network call to Amplitude servers
      const t0 = process.hrtime.bigint();
      try {
        const variants = await remoteClient.fetch(user);
        const t1 = process.hrtime.bigint();
        evalTimeUs   = Number(t1 - t0) / 1000;
        networkCalls  = 1;

        const v = variants.variant(FLAG_KEY);
        variant     = (v && v.value) ? v.value : 'control';
        rawResponse = { [FLAG_KEY]: variants.all()[FLAG_KEY] || { key: 'control', value: 'control', source: 'default' } };
      } catch (err) {
        evalError = err.message;
        console.warn('[remote] fetch error:', err.message);
      }
    }

    // Data sent to the template and embedded in window.BA_SERVER
    const serverData = {
      mode,
      variant,
      userId,
      evalTimeUs: evalTimeUs !== null ? Math.round(evalTimeUs) : null,
      evalTimeMs: evalTimeUs !== null ? (evalTimeUs / 1000).toFixed(2) : null,
      networkCalls,
      flagKey: FLAG_KEY,
      rawResponse,
      error: evalError,
      previewOverride: previewVariant || null,
      analyticsKey: ANALYTICS_KEY
    };

    res
      .cookie('ba_demo_uid', userId, { maxAge: 86400000, httpOnly: true })
      .render('index', { serverData });
  });

  app.listen(PORT, () => {
    console.log(`\nBA Experiment server-side demo running at http://localhost:${PORT}`);
    console.log('  ?mode=local   (default) — in-process evaluation, ~microseconds, 0 network calls');
    console.log('  ?mode=remote  — Amplitude-evaluated, ~10-50 ms, 1 network call');
    console.log('  ?variant=treatment — preview override\n');
  });
}

boot();
