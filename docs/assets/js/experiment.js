(function () {
  'use strict';

  var DEPLOYMENT_KEY = 'client-z2QEZRg7NRb5iM6KIOj33PruBRR2aiNU';
  var FLAG_KEY       = 'new-search-experience';

  var state = {
    variant: 'control',
    rawResponse: null,
    previewOverride: null,
    loaded: false,
    error: null,
    fetchMs: null,
    fetchEndpoint: 'https://api.lab.eu.amplitude.com/sdk/vardata'
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
        payload = { _error: state.error };
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

    var fetchEl = document.getElementById('exp-fetch-detail');
    if (fetchEl) {
      if (state.fetchMs !== null) {
        fetchEl.innerHTML =
          '<span class="exp-fetch-row"><span class="exp-fetch-label">Endpoint</span>' +
          '<span class="exp-fetch-url">' + state.fetchEndpoint + '</span></span>' +
          '<span class="exp-fetch-row"><span class="exp-fetch-label">Round-trip</span>' +
          '<span class="exp-fetch-val">' + state.fetchMs + ' ms</span></span>' +
          '<span class="exp-fetch-row"><span class="exp-fetch-label">Fires</span>' +
          '<span class="exp-fetch-val">on every page load</span></span>';
      } else if (state.error) {
        fetchEl.textContent = 'Fetch failed — ' + state.error;
      } else {
        fetchEl.innerHTML = '<span class="exp-fetch-val" style="color:#64748B;">Fetching…</span>';
      }
    }

    document.querySelectorAll('.exp-preview-btn').forEach(function (btn) {
      var val    = btn.dataset.variant;
      var active = (val === 'auto' && !state.previewOverride) ||
                   (state.previewOverride === val);
      btn.classList.toggle('active', active);
    });
  }

  // ── Initialise Amplitude Experiment SDK ──────────────────────
  function initExperiment() {
    if (!window.Experiment) {
      state.error = 'Experiment SDK not loaded';
      applyVariant('control');
      updateOverlay();
      return;
    }

    var experiment = window.Experiment.initializeWithAmplitudeAnalytics(
      DEPLOYMENT_KEY,
      { serverZone: 'EU' }
    );

    var fetchStart = performance.now();

    experiment.fetch()
      .then(function () {
        state.fetchMs = Math.round(performance.now() - fetchStart);

        // experiment.variant() automatically fires the $exposure event
        var v         = experiment.variant(FLAG_KEY);
        state.variant = (v && v.value) ? v.value : 'control';

        // Capture the full assignments for display in the overlay
        state.rawResponse = experiment.all();
        state.loaded      = true;

        if (!state.previewOverride) applyVariant(state.variant);
        updateOverlay();
      })
      .catch(function (err) {
        state.fetchMs = Math.round(performance.now() - fetchStart);
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

    // Show loading state then initialise
    updateOverlay();
    initExperiment();
  });

})();
