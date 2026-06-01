(function () {
  'use strict';

  // Data baked in by the server — no client-side SDK fetch needed
  var s = window.BA_SERVER || {};

  // ── Fire $exposure so Amplitude records which users saw which variant ────────
  // The server evaluated the flag; the browser must still fire this event so
  // Amplitude can attribute the user to the correct experiment bucket.
  document.addEventListener('DOMContentLoaded', function () {
    if (s.rawResponse && s.rawResponse[s.flagKey] && !s.previewOverride) {
      var flagData = s.rawResponse[s.flagKey];
      // $exposure is the canonical event name Amplitude uses for experiment analysis
      window.amplitude.track('$exposure', {
        flag_key: s.flagKey,
        variant:  flagData.key || flagData.value || s.variant
      });
    }
  });

  // ── Panel open / close ───────────────────────────────────────────────────────
  function openPanel() {
    var panel    = document.getElementById('exp-panel');
    var backdrop = document.getElementById('exp-backdrop');
    if (panel)    panel.classList.add('exp-panel--open');
    if (backdrop) backdrop.style.display = 'block';
  }

  function closePanel() {
    var panel    = document.getElementById('exp-panel');
    var backdrop = document.getElementById('exp-backdrop');
    if (panel)    panel.classList.remove('exp-panel--open');
    if (backdrop) backdrop.style.display = 'none';
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var trigger  = document.getElementById('exp-trigger');
    var closeBtn = document.getElementById('exp-close');
    var backdrop = document.getElementById('exp-backdrop');

    if (trigger)  trigger.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);
  });

})();
