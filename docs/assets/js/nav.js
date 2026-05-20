// assets/js/nav.js
(function () {
  var navRoot = document.getElementById('nav-root');
  if (!navRoot) return;

  navRoot.innerHTML = [
    '<nav class="ba-nav">',
    '  <a href="index.html" class="ba-nav__logo"><i class="fa-solid fa-plane-departure"></i> British Airways</a>',
    '  <ul class="ba-nav__links">',
    '    <li><a href="index.html">Flights</a></li>',
    '    <li><a href="offers.html">Offers</a></li>',
    '    <li><a href="#">Manage</a></li>',
    '    <li><a href="#">Executive Club</a></li>',
    '  </ul>',
    '  <button class="ba-nav__login" id="loginBtn">Sign In</button>',
    '</nav>',
    '<div class="ba-login-modal" id="loginModal" style="display:none">',
    '  <div class="ba-login-modal__box">',
    '    <h2>Sign In to Executive Club</h2>',
    '    <label>Name <input type="text" id="loginName" placeholder="e.g. Joe Wilson" /></label>',
    '    <label>Demo Number <input type="number" id="loginDemoNum" value="1" min="1" max="99" /></label>',
    '    <p class="ba-login-modal__preview">Amplitude User ID: <code id="loginPreview">—</code></p>',
    '    <label class="ba-login-modal__checkbox">',
    '      <input type="checkbox" id="loginExecClub" checked /> Executive Club member',
    '    </label>',
    '    <select id="loginTier">',
    '      <option value="Blue">Blue</option>',
    '      <option value="Bronze">Bronze</option>',
    '      <option value="Silver">Silver</option>',
    '      <option value="Gold">Gold</option>',
    '    </select>',
    '    <div class="ba-login-modal__actions">',
    '      <button id="loginSubmit">Sign In</button>',
    '      <button id="loginClose">Cancel</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  // Highlight active nav link
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navRoot.querySelectorAll('.ba-nav__links a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });

  // Live preview
  function updatePreview() {
    var name = document.getElementById('loginName').value;
    var num  = document.getElementById('loginDemoNum').value;
    document.getElementById('loginPreview').textContent =
      window.BA.generateUserId(name, num);
  }
  document.getElementById('loginName').addEventListener('input', updatePreview);
  document.getElementById('loginDemoNum').addEventListener('input', updatePreview);

  // Open/close
  document.getElementById('loginBtn').addEventListener('click', function () {
    document.getElementById('loginModal').style.display = 'flex';
    updatePreview();
  });
  document.getElementById('loginClose').addEventListener('click', function () {
    document.getElementById('loginModal').style.display = 'none';
  });

  // Close on backdrop click
  document.getElementById('loginModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  // Submit
  document.getElementById('loginSubmit').addEventListener('click', function () {
    var name   = document.getElementById('loginName').value.trim();
    var num    = document.getElementById('loginDemoNum').value;
    var exec   = document.getElementById('loginExecClub').checked;
    var tier   = document.getElementById('loginTier').value;
    if (!name) { alert('Please enter your name.'); return; }
    var userId = window.BA.login(name, num, exec, tier);
    document.getElementById('loginBtn').textContent = name;
    document.getElementById('loginModal').style.display = 'none';
    // Show brief confirmation without blocking alert
    var flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;background:#075AAA;color:white;padding:0.75rem 1.25rem;border-radius:6px;font-size:0.875rem;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    flash.textContent = 'Signed in as ' + userId;
    document.body.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 3500);
  });

  // Restore button label on page load
  var stored = localStorage.getItem('ba_demo_user');
  if (stored) {
    try {
      var u = JSON.parse(stored);
      if (u.date === new Date().toISOString().split('T')[0] && u.name) {
        document.getElementById('loginBtn').textContent = u.name;
      }
    } catch (e) { /* malformed storage — ignore */ }
  }
})();
