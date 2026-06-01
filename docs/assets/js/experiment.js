(function () {
  'use strict';

  var DEPLOYMENT_KEY = 'client-REPLACE_WITH_YOUR_DEPLOYMENT_KEY';
  var FLAG_KEY       = 'new-search-experience';
  var API_URL        = 'https://api.lab.eu.amplitude.com/v1/vardata';

  var state = {
    variant: 'control',
    rawResponse: null,
    previewOverride: null,
    loaded: false,
    error: null
  };

  // ── Apply variant to DOM ─────────────────────────────────────
  function applyVariant(variant) {
    var control   = document.getElementById('search-control');
    var treatment = document.getElementById('search-treatment');
    if (!control || !treatment) return;
    if (variant === 'treatment') {
      control.style.display   = 'none';
      treatment.style.display = '';
    } else {
      control.style.display   = '';
      treatment.style.display = 'none';
    }
  }

  function getEffective() {
    return state.previewOverride || state.variant;
  }

  // ── Update overlay UI ────────────────────────────────────────
  function updateOverlay() {
    var badge     = document.getElementById('exp-badge');
    var jsonBlock = document.getElementById('exp-json');
    var statusEl  = document.getElementById('exp-status');
    var effective = getEffective();

    if (badge) {
      badge.textContent = effective.toUpperCase();
      badge.className   = 'exp-badge exp-badge--' + effective;
    }

    if (jsonBlock) {
      var payload = {};
      if (state.error && !state.loaded) {
        payload = {
          _error: state.error,
          hint: 'Update DEPLOYMENT_KEY in experiment.js'
        };
      } else if (state.rawResponse) {
        payload[FLAG_KEY] = state.rawResponse[FLAG_KEY] || {
          key: 'control',
          note: 'Flag not configured in Amplitude — defaulting to control'
        };
      } else {
        payload = { status: 'fetching…' };
      }
      jsonBlock.textContent = JSON.stringify(payload, null, 2);
    }

    if (statusEl) {
      if (state.previewOverride) {
        statusEl.textContent = 'Preview override active';
        statusEl.className   = 'exp-status exp-status--preview';
      } else if (state.loaded) {
        statusEl.textContent = 'Live — from Amplitude';
        statusEl.className   = 'exp-status exp-status--live';
      } else if (state.error) {
        statusEl.textContent = 'Error — defaulting to control';
        statusEl.className   = 'exp-status exp-status--error';
      } else {
        statusEl.textContent = 'Fetching…';
        statusEl.className   = 'exp-status';
      }
    }

    document.querySelectorAll('.exp-preview-btn').forEach(function (btn) {
      var val    = btn.dataset.variant;
      var active = (val === 'auto' && !state.previewOverride) ||
                   (state.previewOverride === val);
      btn.classList.toggle('active', active);
    });
  }

  // ── Fetch variant from Amplitude Experiment REST API ─────────
  function initExperiment() {
    if (DEPLOYMENT_KEY === 'client-REPLACE_WITH_YOUR_DEPLOYMENT_KEY') {
      state.error = 'Deployment key not configured';
      applyVariant('control');
      updateOverlay();
      return;
    }

    // Pick up user identity from the Analytics SDK
    var deviceId = (window.amplitude && window.amplitude.getDeviceId)
      ? window.amplitude.getDeviceId() : null;

    var userId = null;
    try {
      var stored = localStorage.getItem('ba_demo_user');
      if (stored) userId = JSON.parse(stored).userId;
    } catch (e) {}

    var params = new URLSearchParams();
    if (deviceId) params.set('device_id', deviceId);
    if (userId)   params.set('user_id', userId);

    fetch(API_URL + '?' + params.toString(), {
      headers: { 'Authorization': 'Api-Key ' + DEPLOYMENT_KEY }
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — check your deployment key');
      return res.json();
    })
    .then(function (data) {
      state.rawResponse = data;
      state.loaded      = true;
      var flag          = data[FLAG_KEY];
      state.variant     = (flag && flag.key) ? flag.key : 'control';

      if (!state.previewOverride) applyVariant(state.variant);
      updateOverlay();
    })
    .catch(function (err) {
      console.warn('[BA Experiment] fetch error:', err.message);
      state.error = err.message;
      if (!state.previewOverride) applyVariant('control');
      updateOverlay();
    });
  }

  // ── Panel open / close ───────────────────────────────────────
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

  // ── Boot ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // Default dates for treatment form
    (function () {
      var today = new Date();
      var dep   = new Date(today); dep.setDate(today.getDate() + 7);
      var ret   = new Date(today); ret.setDate(today.getDate() + 14);
      var fmt   = function (d) { return d.toISOString().split('T')[0]; };
      var dEl   = document.getElementById('searchDepartTreatment');
      var rEl   = document.getElementById('searchReturnTreatment');
      if (dEl) dEl.value = fmt(dep);
      if (rEl) rEl.value = fmt(ret);
    })();

    // Trigger + close + backdrop
    var trigger  = document.getElementById('exp-trigger');
    var closeBtn = document.getElementById('exp-close');
    var backdrop = document.getElementById('exp-backdrop');
    if (trigger)  trigger.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);

    // Preview variant buttons
    document.querySelectorAll('.exp-preview-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val           = btn.dataset.variant;
        state.previewOverride = (val === 'auto') ? null : val;
        applyVariant(getEffective());
        updateOverlay();
      });
    });

    // Treatment form submit — fires same events as control
    var treatmentForm = document.getElementById('searchFormTreatment');
    if (treatmentForm) {
      treatmentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var destination = (document.getElementById('searchToTreatment').value || '').trim();
        var cabin       = document.getElementById('searchCabinTreatment').value;
        if (!destination) return;

        window.amplitude.track('Flight Search Completed', {
          destination_query:     destination,
          flights_returned:      Math.floor(Math.random() * 15) + 5,
          is_returning_customer: !!localStorage.getItem('ba_demo_user'),
          cabin_class:           cabin,
          search_ui_variant:     'treatment'
        });

        window.BA.setBooking({ destination: destination, cabin: cabin, passengers: 1 });
        window.location.href = 'results.html?to=' + encodeURIComponent(destination) +
                               '&cabin=' + encodeURIComponent(cabin);
      });
    }

    // Quick-select destination chips
    document.querySelectorAll('.exp-dest-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var destInput = document.getElementById('searchToTreatment');
        if (destInput) destInput.value = chip.dataset.dest;
      });
    });

    // Show loading state then fetch
    updateOverlay();
    initExperiment();
  });

})();
