/* ============================================================
   DeepSpec / DSpark 报告 — Mermaid 初始化 + 缩放/拖拽
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  // ---- Mermaid 初始化 (light theme) ----
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      themeVariables: {
        primaryColor: '#ffffff',
        primaryTextColor: '#1f2328',
        primaryBorderColor: '#0969da',
        lineColor: '#818b98',
        secondaryColor: '#f6f8fa',
        tertiaryColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
        fontSize: '13px'
      },
      flowchart: { curve: 'basis', htmlLabels: true },
      sequence: { actorMargin: 50, messageMargin: 35 }
    });
  }

  // ---- 缩放 / 拖拽 (translate + scale + clamp) ----
  function _clamp(viewport, inner, s, x, y) {
    var cw = viewport.clientWidth, ch = viewport.clientHeight;
    var iw = inner.offsetWidth * s, ih = inner.offsetHeight * s;
    var minX = iw > cw ? cw - iw : (cw - iw) / 2;
    var maxX = iw > cw ? 0 : minX;
    var minY = ih > ch ? ch - ih : (ch - ih) / 2;
    var maxY = ih > ch ? 0 : minY;
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));
    return { x: x, y: y };
  }
  function _setState(inner, s, x, y) {
    inner.dataset._zScale = s;
    inner.dataset._zTx = x;
    inner.dataset._zTy = y;
    inner.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
  }
  function _getViewport(inner) {
    return inner.closest('.mermaid-viewport');
  }

  document.querySelectorAll('.mermaid-zoom-inner').forEach(function (inner) {
    var viewport = _getViewport(inner);
    if (!viewport) return;
    _setState(inner, 1, 0, 0);

    // 按钮: + / - / reset
    var wrap = inner.closest('.mermaid-wrap');
    if (wrap) {
      wrap.querySelectorAll('.mermaid-toolbar button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var s = parseFloat(inner.dataset._zScale || 1);
          var x = parseFloat(inner.dataset._zTx || 0);
          var y = parseFloat(inner.dataset._zTy || 0);
          var action = btn.dataset.act;
          if (action === 'in') s = Math.min(4, s * 1.25);
          else if (action === 'out') s = Math.max(0.4, s / 1.25);
          else if (action === 'reset') { s = 1; x = 0; y = 0; }
          var cw = viewport.clientWidth, ch = viewport.clientHeight;
          var cx = (cw / 2 - x) / (s / 1.25);
          x = cw / 2 - cx * s;
          var cy = (ch / 2 - y) / (s / 1.25);
          y = ch / 2 - cy * s;
          var cl = _clamp(viewport, inner, s, x, y);
          _setState(inner, s, cl.x, cl.y);
        });
      });
    }

    // 滚轮缩放 (围绕鼠标位置)
    viewport.addEventListener('wheel', function (e) {
      e.preventDefault();
      var s = parseFloat(inner.dataset._zScale || 1);
      var x = parseFloat(inner.dataset._zTx || 0);
      var y = parseFloat(inner.dataset._zTy || 0);
      var ns = e.deltaY < 0 ? Math.min(4, s * 1.12) : Math.max(0.4, s / 1.12);
      var rect = viewport.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var cx = (mx - x) / s, cy = (my - y) / s;
      x = mx - cx * ns; y = my - cy * ns;
      var cl = _clamp(viewport, inner, ns, x, y);
      _setState(inner, ns, cl.x, cl.y);
    }, { passive: false });

    // 拖拽
    var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    viewport.addEventListener('mousedown', function (e) {
      dragging = true; sx = e.clientX; sy = e.clientY;
      ox = parseFloat(inner.dataset._zTx || 0); oy = parseFloat(inner.dataset._zTy || 0);
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var x = ox + (e.clientX - sx), y = oy + (e.clientY - sy);
      var s = parseFloat(inner.dataset._zScale || 1);
      var cl = _clamp(viewport, inner, s, x, y);
      _setState(inner, s, cl.x, cl.y);
    });
    window.addEventListener('mouseup', function () { dragging = false; });
  });
});
