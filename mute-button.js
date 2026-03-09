/**
 * ปุ่มปิด/เปิดเสียง - ใส่ใน index.htm หลัง build 3D Vista
 * หลัง build: ถ้าถูก overwrite ให้เพิ่ม <script src="mute-button.js"></script> ก่อน </body>
 *
 * ใช้ 2 วิธี: (1) ฮุก createElement จับ video/audio ตอนสร้าง (2) ถ้ามี window.tour ใช้ player API
 */
(function() {
  'use strict';
  var userMuted = false;
  var wrap, btn, iconOn, iconOff;
  var createdMedia = [];

  // --- ฮุก createElement ให้จับ video/audio ทุกตัวที่ถูกสร้างใน document นี้ ---
  var nativeCreateElement = document.createElement.bind(document);
  document.createElement = function(tagName) {
    var el = nativeCreateElement(tagName);
    if (tagName && (tagName.toLowerCase() === 'video' || tagName.toLowerCase() === 'audio')) {
      createdMedia.push(el);
      if (userMuted) try { el.muted = true; } catch (e) {}
    }
    return el;
  };

  function collect(root, out) {
    if (!root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('video, audio');
    for (var i = 0; i < list.length; i++) out.push(list[i]);
    var all = root.querySelectorAll('*');
    for (var j = 0; j < all.length; j++) {
      if (all[j].shadowRoot) collect(all[j].shadowRoot, out);
    }
  }
  function collectIframes(doc, out) {
    try {
      var frames = (doc || document).querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        try {
          var d = frames[i].contentDocument;
          if (d) { collect(d, out); collectIframes(d, out); }
        } catch (e) {}
      }
    } catch (e) {}
  }
  function getAllMedia() {
    var seen = {};
    var out = [];
    createdMedia.forEach(function(el) {
      if (el && el.nodeName && !seen[el]) { seen[el] = true; out.push(el); }
    });
    collect(document, out);
    collectIframes(document, out);
    return out;
  }
  function applyMute(muted) {
    userMuted = muted;
    var el = getAllMedia();
    for (var i = 0; i < el.length; i++) {
      try { el[i].muted = muted; } catch (e) {}
    }
  }
  function updateIcon() {
    if (!iconOn || !iconOff) return;
    if (userMuted) {
      iconOn.style.display = 'none';
      iconOff.style.display = 'block';
      if (btn) btn.title = 'เปิดเสียง';
    } else {
      iconOn.style.display = 'block';
      iconOff.style.display = 'none';
      if (btn) btn.title = 'ปิดเสียง';
    }
  }

  function tryTourMute(nextMuted) {
    try {
      var t = window.tour || (typeof tour !== 'undefined' ? tour : null);
      if (t && t.player && typeof t.player.set === 'function' && typeof t.player.get === 'function') {
        t.player.set('mute', nextMuted);
        return true;
      }
    } catch (e) {}
    return false;
  }
  function getTourMuted() {
    try {
      var t = window.tour || (typeof tour !== 'undefined' ? tour : null);
      if (t && t.player && typeof t.player.get === 'function') {
        return !!t.player.get('mute');
      }
    } catch (e) {}
    return undefined;
  }

  function toggle(ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    var useTour = tryTourMute(!userMuted);
    if (useTour) {
      var m = getTourMuted();
      if (m !== undefined) userMuted = m;
    } else {
      userMuted = !userMuted;
      applyMute(userMuted);
    }
    updateIcon();
  }
  function addBtn() {
    if (document.getElementById('tdvMuteWrap')) return;
    wrap = document.createElement('div');
    wrap.id = 'tdvMuteWrap';
    wrap.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;pointer-events:none;';
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'tdvMuteBtn';
    btn.title = 'ปิดเสียง';
    btn.style.cssText = 'pointer-events:auto;width:48px;height:48px;border:none;border-radius:50%;background:rgba(0,0,0,0.65);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    iconOn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconOn.setAttribute('viewBox', '0 0 24 24');
    iconOn.setAttribute('fill', 'none');
    iconOn.setAttribute('stroke', 'currentColor');
    iconOn.setAttribute('stroke-width', '2');
    iconOn.setAttribute('stroke-linecap', 'round');
    iconOn.setAttribute('stroke-linejoin', 'round');
    iconOn.style.width = '26px';
    iconOn.style.height = '26px';
    iconOn.style.pointerEvents = 'none';
    iconOn.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
    iconOff = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconOff.setAttribute('viewBox', '0 0 24 24');
    iconOff.setAttribute('fill', 'none');
    iconOff.setAttribute('stroke', 'currentColor');
    iconOff.setAttribute('stroke-width', '2');
    iconOff.setAttribute('stroke-linecap', 'round');
    iconOff.setAttribute('stroke-linejoin', 'round');
    iconOff.style.width = '26px';
    iconOff.style.height = '26px';
    iconOff.style.display = 'none';
    iconOff.style.pointerEvents = 'none';
    iconOff.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    btn.appendChild(iconOn);
    btn.appendChild(iconOff);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
    btn.addEventListener('click', toggle, true);
    btn.addEventListener('touchend', toggle, true);
    updateIcon();
    applyMute(userMuted);
    setInterval(function() {
      if (userMuted) {
        var el = getAllMedia();
        for (var i = 0; i < el.length; i++) try { el[i].muted = true; } catch (e) {}
      }
    }, 200);
    try {
      var mo = new MutationObserver(function() { if (userMuted) applyMute(true); });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }
  function go() {
    addBtn();
  }
  if (document.readyState === 'complete') {
    setTimeout(go, 500);
  } else {
    window.addEventListener('load', function() { setTimeout(go, 500); });
  }
})();
