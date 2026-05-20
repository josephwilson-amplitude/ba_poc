(function () {
  // Add plugins before init
  if (window.sessionReplay) {
    window.amplitude.add(window.sessionReplay.plugin({ sampleRate: 1 }));
  }
  if (window.engagement) {
    window.amplitude.add(window.engagement.plugin());
  }

  // Init — EU data centre required
  window.amplitude.init("f70ef2dbfa2b6bfc6316397d090f6b16", {
    fetchRemoteConfig: true,
    autocapture: true,
    serverUrl: "https://api.eu.amplitude.com/2/httpapi"
  });

  // ── Identity helpers ──────────────────────────────────────────────
  window.BA = window.BA || {};

  window.BA.generateUserId = function (name, demoNumber) {
    const clean = (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user';
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return clean + '_' + (demoNumber || 1) + '_' + today;
    // e.g. "joe_1_20260520"
  };

  window.BA.login = function (name, demoNumber, isExecClub, tier) {
    const userId = window.BA.generateUserId(name, demoNumber);
    window.amplitude.setUserId(userId);
    window.amplitude.identify(
      new window.amplitude.Identify()
        .set('executive_club_member', !!isExecClub)
        .set('executive_club_tier', tier || 'Blue')
    );
    localStorage.setItem('ba_demo_user', JSON.stringify({
      name: name,
      demoNumber: demoNumber,
      isExecClub: isExecClub,
      tier: tier,
      userId: userId,
      date: new Date().toISOString().split('T')[0]
    }));
    return userId;
  };

  window.BA.logout = function () {
    window.amplitude.reset();
    localStorage.removeItem('ba_demo_user');
  };

  // Restore session on page load
  (function restoreSession() {
    var stored = localStorage.getItem('ba_demo_user');
    if (!stored) return;
    var u = JSON.parse(stored);
    if (u.date !== new Date().toISOString().split('T')[0]) {
      localStorage.removeItem('ba_demo_user');
      return;
    }
    window.amplitude.setUserId(u.userId);
  })();

  // ── Booking state (passed page-to-page via sessionStorage) ────────
  window.BA.setBooking = function (data) {
    sessionStorage.setItem('ba_booking', JSON.stringify(data));
  };
  window.BA.getBooking = function () {
    var b = sessionStorage.getItem('ba_booking');
    return b ? JSON.parse(b) : {};
  };
})();
