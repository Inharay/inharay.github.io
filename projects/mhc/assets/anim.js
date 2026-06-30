/* ============================================================
   mHC 论文讲解 - 交互式 SVG 动画引擎
   AnimEngine 类 + 6 个场景
   ============================================================ */

class AnimEngine {
  constructor(root) {
    this.root = root;
    this.svg = root.querySelector('svg');
    this.ns = 'http://www.w3.org/2000/svg';
    this.scenes = {};
    this.currentScene = null;
    this.isPlaying = false;
    this.frameId = null;
    this.t = 0;
    this.duration = 3000;
    this._initControls();
    this._initSceneSelect();
  }

  _initControls() {
    const playBtn = this.root.querySelector('.anim-btn[data-act="play"]');
    const resetBtn = this.root.querySelector('.anim-btn[data-act="reset"]');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (this.isPlaying) { this.pause(); } else { this.play(); }
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  }

  _initSceneSelect() {
    const btns = this.root.querySelectorAll('.anim-btn[data-scene]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchScene(btn.dataset.scene);
      });
    });
    const first = this.root.querySelector('.anim-btn[data-scene]');
    if (first) { first.classList.add('active'); }
    // 注意: switchScene 延迟到 registerScene 之后调用, 否则 scene 未注册时 SVG 为空
  }

  // 在所有 scene 注册完成后调用, 强制渲染初始帧
  initDefaultScene() {
    const first = this.root.querySelector('.anim-btn[data-scene]');
    if (first) { first.classList.add('active'); this.switchScene(first.dataset.scene); }
    else if (Object.keys(this.scenes).length > 0) { this.switchScene(Object.keys(this.scenes)[0]); }
  }

  registerScene(name, fn) { this.scenes[name] = fn; }

  switchScene(name) {
    this.pause();
    this.currentScene = name;
    this._clearSvg();
    if (this.scenes[name]) { this.scenes[name](this); }
    this.reset();
  }

  _clearSvg() {
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
  }

  play() {
    if (this.isPlaying || !this.currentScene) return;
    this.isPlaying = true;
    const playBtn = this.root.querySelector('.anim-btn[data-act="play"]');
    if (playBtn) playBtn.textContent = '⏸ 暂停';
    const start = performance.now();
    const animate = (now) => {
      if (!this.isPlaying) return;
      this.t = ((now - start) % this.duration) / this.duration;
      if (this.scenes[this.currentScene]) {
        this._clearSvg();
        this.scenes[this.currentScene](this);
      }
      this.frameId = requestAnimationFrame(animate);
    };
    this.frameId = requestAnimationFrame(animate);
  }

  pause() {
    this.isPlaying = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    const playBtn = this.root.querySelector('.anim-btn[data-act="play"]');
    if (playBtn) playBtn.textContent = '▶ 播放';
  }

  reset() {
    this.pause();
    this.t = 0;
    this._clearSvg();
    if (this.currentScene && this.scenes[this.currentScene]) {
      this.scenes[this.currentScene](this);
    }
  }

  // --- 工具方法 ---
  el(tag, attrs = {}, children = []) {
    const e = document.createElementNS(this.ns, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') { e.textContent = v; continue; }
      e.setAttribute(k, v);
    }
    for (const c of (Array.isArray(children) ? children : [children])) {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    }
    return e;
  }

  lerp(a, b, t) { return a + (b - a) * t; }
  ease(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
}

// ============================================================
// 场景 1: 残差连接范式对比 (ResNet → HC → mHC)
// ============================================================
function scene1_compare(eng) {
  const svg = eng.svg;
  svg.setAttribute('viewBox', '0 0 820 280');
  const colors = { base: '#2563eb', hc: '#d97706', mhc: '#059669', text: '#1a1a1a', muted: '#888' };
  const phase = eng.t;

  function drawColumn(x, title, subtitle, color, arch) {
    const g = eng.el('g', { transform: `translate(${x}, 0)` });

    // 标题
    g.appendChild(eng.el('text', { x: 120, y: 24, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: color }, title));
    g.appendChild(eng.el('text', { x: 120, y: 40, 'text-anchor': 'middle', 'font-size': 11, fill: colors.muted }, subtitle));

    // 输入 x_l
    g.appendChild(eng.el('rect', { x: 80, y: 55, width: 80, height: 24, rx: 4, fill: color + '22', stroke: color, 'stroke-width': 1.5 }));
    g.appendChild(eng.el('text', { x: 120, y: 71, 'text-anchor': 'middle', 'font-size': 12, fill: colors.text }, 'x_l'));

    if (arch === 'resnet') {
      // 残差直连 + F(x)
      g.appendChild(eng.el('line', { x1: 120, y1: 79, x2: 120, y2: 100, stroke: color, 'stroke-width': 2 }));
      g.appendChild(eng.el('rect', { x: 80, y: 100, width: 80, height: 28, rx: 4, fill: '#f3f4f6', stroke: color, 'stroke-width': 1.5 }));
      g.appendChild(eng.el('text', { x: 120, y: 118, 'text-anchor': 'middle', 'font-size': 12, fill: colors.text }, 'F(x)'));
      g.appendChild(eng.el('line', { x1: 120, y1: 128, x2: 120, y2: 150, stroke: color, 'stroke-width': 2 }));
      // 加号
      g.appendChild(eng.el('circle', { cx: 120, cy: 155, r: 12, fill: 'white', stroke: color, 'stroke-width': 1.5 }));
      g.appendChild(eng.el('text', { x: 120, y: 160, 'text-anchor': 'middle', 'font-size': 16, fill: color }, '+'));
      // 残差旁路
      g.appendChild(eng.el('path', { d: 'M 40 67 L 40 155 L 108 155', fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-dasharray': '4,3' }));
      g.appendChild(eng.el('text', { x: 30, y: 115, 'text-anchor': 'middle', 'font-size': 10, fill: colors.muted, transform: 'rotate(-90 30 115)' }, 'identity'));
      // 输出
      g.appendChild(eng.el('line', { x1: 120, y1: 167, x2: 120, y2: 185, stroke: color, 'stroke-width': 2 }));
      g.appendChild(eng.el('rect', { x: 80, y: 185, width: 80, height: 24, rx: 4, fill: color + '22', stroke: color, 'stroke-width': 1.5 }));
      g.appendChild(eng.el('text', { x: 120, y: 201, 'text-anchor': 'middle', 'font-size': 12, fill: colors.text }, 'x_{l+1}'));
      // 注解
      g.appendChild(eng.el('text', { x: 120, y: 230, 'text-anchor': 'middle', 'font-size': 11, fill: colors.muted }, 'x_{l+1} = x_l + F(x_l)'));
      g.appendChild(eng.el('text', { x: 120, y: 250, 'text-anchor': 'middle', 'font-size': 10, fill: color }, '✓ 严格恒等映射'));
    } else if (arch === 'hc') {
      // n=4 流
      const n = 4;
      for (let i = 0; i < n; i++) {
        const yi = 85 + i * 10;
        g.appendChild(eng.el('rect', { x: 50, y: yi, width: 14, height: 8, fill: color + (i===0?'':'44'), stroke: color, 'stroke-width': 0.8 }));
      }
      g.appendChild(eng.el('text', { x: 30, y: 100, 'text-anchor': 'middle', 'font-size': 10, fill: colors.muted }, 'nC'));
      // H_res 矩阵 (无约束)
      g.appendChild(eng.el('rect', { x: 100, y: 82, width: 50, height: 36, rx: 4, fill: color + '15', stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': '3,2' }));
      g.appendChild(eng.el('text', { x: 125, y: 103, 'text-anchor': 'middle', 'font-size': 11, fill: color }, 'H^res'));
      // 动画：信号放大波纹
      const amp = 1 + Math.sin(phase * Math.PI * 2) * 1.5;
      g.appendChild(eng.el('text', { x: 175, y: 95, 'font-size': 10, fill: colors.muted }, `增益≈${amp.toFixed(1)}`));
      // F
      g.appendChild(eng.el('rect', { x: 100, y: 130, width: 50, height: 24, rx: 4, fill: '#f3f4f6', stroke: color, 'stroke-width': 1.5 }));
      g.appendChild(eng.el('text', { x: 125, y: 146, 'text-anchor': 'middle', 'font-size': 11, fill: colors.text }, 'F(x)'));
      // 输出流
      for (let i = 0; i < n; i++) {
        const yi = 170 + i * 10;
        const op = eng.clamp(0.3 + Math.sin(phase * Math.PI * 2 + i) * 0.4, 0.1, 1);
        g.appendChild(eng.el('rect', { x: 50, y: yi, width: 14, height: 8, fill: color, 'fill-opacity': op, stroke: color, 'stroke-width': 0.8 }));
      }
      g.appendChild(eng.el('text', { x: 120, y: 230, 'text-anchor': 'middle', 'font-size': 11, fill: colors.muted }, 'H^res·x + H^post·F(H^pre·x)'));
      g.appendChild(eng.el('text', { x: 120, y: 250, 'text-anchor': 'middle', 'font-size': 10, fill: '#dc2626' }, '✗ 无约束 → 信号发散'));
    } else { // mhc
      const n = 4;
      for (let i = 0; i < n; i++) {
        g.appendChild(eng.el('rect', { x: 50, y: 85 + i * 10, width: 14, height: 8, fill: color + (i===0?'':'44'), stroke: color, 'stroke-width': 0.8 }));
      }
      g.appendChild(eng.el('text', { x: 30, y: 100, 'text-anchor': 'middle', 'font-size': 10, fill: colors.muted }, 'nC'));
      // H_res 双随机矩阵 (约束)
      g.appendChild(eng.el('rect', { x: 100, y: 82, width: 50, height: 36, rx: 4, fill: color + '15', stroke: color, 'stroke-width': 2 }));
      g.appendChild(eng.el('text', { x: 125, y: 103, 'text-anchor': 'middle', 'font-size': 11, fill: color }, 'P_M(H^res)'));
      // 双随机约束标记 - 行列和=1
      g.appendChild(eng.el('text', { x: 162, y: 95, 'font-size': 9, fill: color }, 'Σ行=1'));
      g.appendChild(eng.el('text', { x: 162, y: 108, 'font-size': 9, fill: color }, 'Σ列=1'));
      // 信号稳定
      g.appendChild(eng.el('text', { x: 175, y: 120, 'font-size': 10, fill: color }, '增益≈1.0'));
      // F
      g.appendChild(eng.el('rect', { x: 100, y: 130, width: 50, height: 24, rx: 4, fill: '#f3f4f6', stroke: color, 'stroke-width': 1.5 }));
      g.appendChild(eng.el('text', { x: 125, y: 146, 'text-anchor': 'middle', 'font-size': 11, fill: colors.text }, 'F(x)'));
      // 输出流 - 均匀稳定
      for (let i = 0; i < n; i++) {
        g.appendChild(eng.el('rect', { x: 50, y: 170 + i * 10, width: 14, height: 8, fill: color, 'fill-opacity': 0.7, stroke: color, 'stroke-width': 0.8 }));
      }
      g.appendChild(eng.el('text', { x: 120, y: 230, 'text-anchor': 'middle', 'font-size': 11, fill: colors.muted }, 'P_M(H^res)·x + H^post·F(H^pre·x)'));
      g.appendChild(eng.el('text', { x: 120, y: 250, 'text-anchor': 'middle', 'font-size': 10, fill: color }, '✓ 双随机 → 信号守恒'));
    }
    svg.appendChild(g);
  }

  drawColumn(10, 'ResNet', '标准残差', colors.base, 'resnet');
  // 分隔线
  svg.appendChild(eng.el('line', { x1: 270, y1: 20, x2: 270, y2: 260, stroke: '#e0e0e0', 'stroke-width': 1, 'stroke-dasharray': '4,4' }));
  drawColumn(280, 'HC', 'Hyper-Connections', colors.hc, 'hc');
  svg.appendChild(eng.el('line', { x1: 540, y1: 20, x2: 540, y2: 260, stroke: '#e0e0e0', 'stroke-width': 1, 'stroke-dasharray': '4,4' }));
  drawColumn(550, 'mHC (本文)', 'Manifold-Constrained', colors.mhc, 'mhc');
}

// ============================================================
// 场景 2: HC 不稳定性传播 — 复合映射增益爆炸
// ============================================================
function scene2_instability(eng) {
  const svg = eng.svg;
  svg.setAttribute('viewBox', '0 0 820 300');
  const t = eng.t;

  // 左半：HC 信号爆炸; 右半：mHC 信号守恒
  function drawSignalExplosion(x0, label, color, isHC) {
    const g = eng.el('g', { transform: `translate(${x0}, 0)` });
    g.appendChild(eng.el('text', { x: 180, y: 24, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: color }, label));

    // 画 L 层的信号柱
    const L = 8;
    const barW = 30;
    const gap = 8;
    const startX = 30;
    for (let l = 0; l < L; l++) {
      const cx = startX + l * (barW + gap) + barW / 2;
      // 理想基线
      g.appendChild(eng.el('line', { x1: cx, y1: 250, x2: cx, y2: 100, stroke: '#e0e0e0', 'stroke-width': 1, 'stroke-dasharray': '2,2' }));

      let amp;
      if (isHC) {
        // 指数增长，随时间波动
        const base = Math.pow(1.5, l);
        amp = base * (1 + Math.sin(t * Math.PI * 2 + l * 0.5) * 0.3);
      } else {
        amp = 1 + Math.sin(t * Math.PI * 2 + l * 0.3) * 0.05;
      }
      const barH = Math.min(amp * 15, 150);
      const yTop = 250 - barH;

      // 信号柱
      const fillColor = isHC && amp > 3 ? '#dc2626' : color;
      g.appendChild(eng.el('rect', { x: cx - barW/2, y: yTop, width: barW, height: barH, fill: fillColor, 'fill-opacity': 0.6, stroke: fillColor, 'stroke-width': 1.5, rx: 2 }));

      // 增益数值
      g.appendChild(eng.el('text', { x: cx, y: yTop - 6, 'text-anchor': 'middle', 'font-size': 9, fill: fillColor, 'font-weight': 600 }, amp.toFixed(1)));

      // 层标签
      g.appendChild(eng.el('text', { x: cx, y: 265, 'text-anchor': 'middle', 'font-size': 9, fill: '#888' }, `L${l}`));
    }

    // 理想线 y=1
    g.appendChild(eng.el('line', { x1: 20, y1: 235, x2: 340, y2: 235, stroke: '#059669', 'stroke-width': 1.5, 'stroke-dasharray': '5,3' }));
    g.appendChild(eng.el('text', { x: 345, y: 238, 'font-size': 9, fill: '#059669' }, '理想=1'));

    // 底部说明
    const note = isHC ? '∏H^res → 指数爆炸 (峰值≈3000)' : '∏P_M(H^res) → 有界 (峰值≈1.6)';
    g.appendChild(eng.el('text', { x: 180, y: 285, 'text-anchor': 'middle', 'font-size': 11, fill: isHC ? '#dc2626' : color }, note));

    svg.appendChild(g);
  }

  drawSignalExplosion(0, 'HC: 无约束复合映射', '#d97706', true);
  svg.appendChild(eng.el('line', { x1: 410, y1: 20, x2: 410, y2: 290, stroke: '#e0e0e0', 'stroke-width': 1, 'stroke-dasharray': '4,4' }));
  drawSignalExplosion(410, 'mHC: 双随机约束', '#059669', false);
}

// ============================================================
// 场景 3: Birkhoff 多面体 — 双随机矩阵的几何意义
// ============================================================
function scene3_birkhoff(eng) {
  const svg = eng.svg;
  svg.setAttribute('viewBox', '0 0 820 300');
  const t = eng.t;

  const g = eng.el('g');

  // 左侧：自由空间 vs Birkhoff 多面体
  // 画一个大圆代表所有 n×n 矩阵空间
  const cx = 200, cy = 150, R = 110;
  g.appendChild(eng.el('circle', { cx, cy, r: R, fill: '#dbeafe', 'fill-opacity': 0.3, stroke: '#2563eb', 'stroke-width': 1.5, 'stroke-dasharray': '4,3' }));
  g.appendChild(eng.el('text', { x: cx, y: 40, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600, fill: '#2563eb' }, 'R^{n×n} 全空间'));
  g.appendChild(eng.el('text', { x: cx, y: 55, 'text-anchor': 'middle', 'font-size': 10, fill: '#888' }, '(无约束)'));

  // Birkhoff 多面体 (凸包) — 画一个内嵌多边形
  const polyCx = cx, polyCy = cy, polyR = 55;
  const nVerts = 6; // 代表排列矩阵的凸包
  const polyPoints = [];
  for (let i = 0; i < nVerts; i++) {
    const ang = (i / nVerts) * Math.PI * 2 - Math.PI / 2;
    polyPoints.push([polyCx + Math.cos(ang) * polyR, polyCy + Math.sin(ang) * polyR]);
  }
  g.appendChild(eng.el('polygon', {
    points: polyPoints.map(p => p.join(',')).join(' '),
    fill: '#d1fae5', 'fill-opacity': 0.5, stroke: '#059669', 'stroke-width': 2
  }));
  g.appendChild(eng.el('text', { x: polyCx, y: polyCy - 5, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: '#059669' }, 'Birkhoff'));
  g.appendChild(eng.el('text', { x: polyCx, y: polyCy + 12, 'text-anchor': 'middle', 'font-size': 10, fill: '#059669' }, '多面体'));

  // 排列矩阵顶点
  polyPoints.forEach((p, i) => {
    g.appendChild(eng.el('circle', { cx: p[0], cy: p[1], r: 4, fill: '#059669' }));
    g.appendChild(eng.el('text', { x: p[0], y: p[1] - 8, 'text-anchor': 'middle', 'font-size': 8, fill: '#059669' }, `P${i+1}`));
  });

  // 动画：H^res 从外部飞入多面体
  const startAng = t * Math.PI * 2;
  const sx = cx + Math.cos(startAng) * (R - 10);
  const sy = cy + Math.sin(startAng) * (R - 10);
  const ex = polyCx + Math.cos(startAng) * (polyR - 5);
  const ey = polyCy + Math.sin(startAng) * (polyR - 5);
  const projT = eng.ease(eng.clamp(t * 2, 0, 1));
  const fx = eng.lerp(sx, ex, projT);
  const fy = eng.lerp(sy, ey, projT);

  // 原始 H^res
  g.appendChild(eng.el('circle', { cx: sx, cy: sy, r: 6, fill: '#d97706', stroke: 'white', 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: sx + 10, y: sy + 4, 'font-size': 10, fill: '#d97706', 'font-weight': 600 }, 'H^res'));

  // 投影路径
  g.appendChild(eng.el('line', { x1: sx, y1: sy, x2: fx, y2: fy, stroke: '#7c3aed', 'stroke-width': 1.5, 'stroke-dasharray': '3,2' }));
  // 投影后点
  g.appendChild(eng.el('circle', { cx: fx, cy: fy, r: 6, fill: '#059669', stroke: 'white', 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: fx + 10, y: fy + 4, 'font-size': 10, fill: '#059669', 'font-weight': 600 }, 'P_M(H^res)'));

  // 箭头
  g.appendChild(eng.el('text', { x: (sx+fx)/2, y: (sy+fy)/2 - 8, 'text-anchor': 'middle', 'font-size': 9, fill: '#7c3aed' }, '投影'));

  // 右侧：双随机矩阵的三个性质
  const rx = 430;
  g.appendChild(eng.el('text', { x: rx + 180, y: 30, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#1a1a1a' }, '双随机矩阵的三大性质'));

  const props = [
    { y: 65, title: '① 范数保持', desc: '‖H^res‖₂ ≤ 1 (非膨胀)', color: '#2563eb' },
    { y: 130, title: '② 组合闭合', desc: '∏ H^res 仍为双随机', color: '#059669' },
    { y: 195, title: '③ 几何意义', desc: '排列矩阵的凸组合 (凸包)', color: '#7c3aed' },
    { y: 260, title: '④ 信号守恒', desc: '行/列和=1 → 均值不变', color: '#d97706' },
  ];
  props.forEach(p => {
    g.appendChild(eng.el('rect', { x: rx, y: p.y - 20, width: 360, height: 45, rx: 6, fill: p.color + '11', stroke: p.color, 'stroke-width': 1 }));
    g.appendChild(eng.el('text', { x: rx + 12, y: p.y - 2, 'font-size': 13, 'font-weight': 700, fill: p.color }, p.title));
    g.appendChild(eng.el('text', { x: rx + 12, y: p.y + 16, 'font-size': 11, fill: '#555' }, p.desc));
  });

  svg.appendChild(g);
}

// ============================================================
// 场景 4: Sinkhorn-Knopp 迭代归一化
// ============================================================
function scene4_sinkhorn(eng) {
  const svg = eng.svg;
  svg.setAttribute('viewBox', '0 0 820 320');
  const t = eng.t;

  const g = eng.el('g');

  // 一个 4x4 矩阵的迭代过程
  const n = 4;
  const cellSize = 40;
  const mx = 40, my = 50;

  // 生成初始随机矩阵 (固定种子)
  const rawVals = [
    [0.8, 2.1, 0.3, 1.5],
    [0.2, 0.9, 1.8, 0.4],
    [1.6, 0.3, 0.7, 2.2],
    [0.5, 1.9, 1.1, 0.6],
  ];

  // 迭代步数 0..20
  const step = Math.floor(t * 20);
  const stepT = (t * 20) - step; // 步内插值

  // 模拟 Sinkhorn 迭代: 交替行/列归一化
  let mat = rawVals.map(r => [...r]);
  for (let s = 0; s < step; s++) {
    if (s % 2 === 0) {
      // 行归一化
      mat = mat.map(row => {
        const sum = row.reduce((a, b) => a + b, 0);
        return row.map(v => v / sum);
      });
    } else {
      // 列归一化
      for (let j = 0; j < n; j++) {
        let colSum = 0;
        for (let i = 0; i < n; i++) colSum += mat[i][j];
        for (let i = 0; i < n; i++) mat[i][j] /= colSum;
      }
    }
  }
  // 步内插值到下一步
  let nextMat = mat.map(r => [...r]);
  if (step < 20) {
    if (step % 2 === 0) {
      nextMat = nextMat.map(row => {
        const sum = row.reduce((a, b) => a + b, 0);
        return row.map(v => v / sum);
      });
    } else {
      for (let j = 0; j < n; j++) {
        let colSum = 0;
        for (let i = 0; i < n; i++) colSum += nextMat[i][j];
        for (let i = 0; i < n; i++) nextMat[i][j] /= colSum;
      }
    }
    mat = mat.map((row, i) => row.map((v, j) => eng.lerp(v, nextMat[i][j], stepT)));
  }

  // 标题
  const opType = step % 2 === 0 ? '行归一化' : '列归一化';
  g.appendChild(eng.el('text', { x: 120, y: 30, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#7c3aed' }, `Sinkhorn-Knopp 迭代`));
  g.appendChild(eng.el('text', { x: 120, y: 305, 'text-anchor': 'middle', 'font-size': 12, fill: '#555' }, `迭代 ${step}/20 — 当前: ${step > 0 ? opType : '初始化'}`));

  // 画矩阵
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = mat[i][j];
      const opacity = eng.clamp(v * 2, 0.05, 1);
      // 高亮当前操作的行或列
      let highlight = false;
      if (step > 0 && step % 2 === 0 && step < 20) highlight = (i === Math.floor(stepT * n)); // 行高亮
      if (step > 0 && step % 2 === 1 && step < 20) highlight = (j === Math.floor(stepT * n)); // 列高亮

      const stroke = highlight ? '#dc2626' : '#cbd5e1';
      const sw = highlight ? 2 : 0.5;
      g.appendChild(eng.el('rect', {
        x: mx + j * cellSize, y: my + i * cellSize, width: cellSize, height: cellSize,
        fill: '#7c3aed', 'fill-opacity': opacity, stroke: stroke, 'stroke-width': sw
      }));
      g.appendChild(eng.el('text', {
        x: mx + j * cellSize + cellSize/2, y: my + i * cellSize + cellSize/2 + 4,
        'text-anchor': 'middle', 'font-size': 10, fill: opacity > 0.4 ? 'white' : '#666'
      }, v.toFixed(2)));
    }
  }

  // 行和标签
  for (let i = 0; i < n; i++) {
    const rowSum = mat[i].reduce((a, b) => a + b, 0);
    g.appendChild(eng.el('text', { x: mx + n * cellSize + 8, y: my + i * cellSize + cellSize/2 + 4, 'font-size': 10, fill: '#059669', 'font-weight': 600 }, `Σ=${rowSum.toFixed(2)}`));
  }
  // 列和标签
  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) colSum += mat[i][j];
    g.appendChild(eng.el('text', { x: mx + j * cellSize + cellSize/2, y: my + n * cellSize + 15, 'text-anchor': 'middle', 'font-size': 10, fill: '#059669', 'font-weight': 600 }, `${colSum.toFixed(2)}`));
  }

  // 右侧：流程说明
  const rx = 280;
  g.appendChild(eng.el('text', { x: rx + 10, y: 40, 'font-size': 14, 'font-weight': 700, fill: '#1a1a1a' }, '算法流程'));

  const steps = [
    '1. M⁽⁰⁾ = exp(H̃^res)  → 全正',
    '2. 行归一化: 每行 ÷ 行和',
    '3. 列归一化: 每列 ÷ 列和',
    '4. 交替重复步骤 2-3',
    '5. 收敛 → 双随机矩阵',
    '',
    '实际迭代: t_max = 20',
    '近似解, 偏差有界 (≤1.6)',
  ];
  steps.forEach((s, i) => {
    const y = 65 + i * 22;
    const isActive = (step === 0 && i === 0) || (step > 0 && step % 2 === 0 && i === 1) || (step > 0 && step % 2 === 1 && i === 2) || (step >= 20 && i === 4);
    g.appendChild(eng.el('text', { x: rx + 10, y, 'font-size': 12, fill: isActive ? '#7c3aed' : '#888', 'font-weight': isActive ? 700 : 400 }, s));
  });

  // 收敛曲线
  const cgX = rx + 10, cgY = 270, cgW = 280, cgH = 40;
  g.appendChild(eng.el('rect', { x: cgX, y: cgY, width: cgW, height: cgH, fill: 'none', stroke: '#e0e0e0', 'stroke-width': 1 }));
  g.appendChild(eng.el('text', { x: cgX, y: cgY - 5, 'font-size': 10, fill: '#888' }, '偏差收敛'));
  // 画曲线
  let pathD = '';
  for (let s = 0; s <= 20; s++) {
    const conv = Math.exp(-s * 0.3);
    const px = cgX + (s / 20) * cgW;
    const py = cgY + cgH - conv * cgH;
    pathD += (s === 0 ? 'M' : 'L') + ` ${px} ${py} `;
  }
  g.appendChild(eng.el('path', { d: pathD, fill: 'none', stroke: '#059669', 'stroke-width': 2 }));
  // 当前点
  const conv = Math.exp(-step * 0.3);
  const cpx = cgX + (step / 20) * cgW;
  const cpy = cgY + cgH - conv * cgH;
  g.appendChild(eng.el('circle', { cx: cpx, cy: cpy, r: 4, fill: '#dc2626' }));

  svg.appendChild(g);
}

// ============================================================
// 场景 5: mHC 完整前向数据流
// ============================================================
function scene5_forward(eng) {
  const svg = eng.svg;
  svg.setAttribute('viewBox', '0 0 820 340');
  const t = eng.t;

  const g = eng.el('g');
  const colors = { stream: '#2563eb', pre: '#d97706', post: '#059669', res: '#7c3aed', F: '#555', text: '#1a1a1a' };

  // n=4 流
  const n = 4;
  const streamX = 40;

  // 输入 x_l (n×C 矩阵)
  g.appendChild(eng.el('text', { x: 60, y: 25, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: colors.stream }, 'x_l ∈ R^{n×C}'));
  for (let i = 0; i < n; i++) {
    const yi = 40 + i * 16;
    g.appendChild(eng.el('rect', { x: streamX, y: yi, width: 40, height: 14, rx: 2, fill: colors.stream + '22', stroke: colors.stream, 'stroke-width': 1 }));
    g.appendChild(eng.el('text', { x: streamX + 20, y: yi + 11, 'text-anchor': 'middle', 'font-size': 8, fill: colors.text }, `s${i}`));
  }

  // 数据流动画 - packet 从 x_l 飞向 flatten
  const packetT = eng.clamp(t * 3 % 1, 0, 1);
  if (packetT < 0.5) {
    const px = eng.lerp(80, 130, packetT * 2);
    g.appendChild(eng.el('circle', { cx: px, cy: 70, r: 5, fill: colors.stream, opacity: 1 - packetT }));
  }

  // Flatten vec(x_l) → R^{1×nC}
  g.appendChild(eng.el('rect', { x: 130, y: 55, width: 60, height: 30, rx: 4, fill: '#f3f4f6', stroke: colors.stream, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: 160, y: 74, 'text-anchor': 'middle', 'font-size': 10, fill: colors.text }, 'vec(x_l)'));
  g.appendChild(eng.el('text', { x: 160, y: 98, 'text-anchor': 'middle', 'font-size': 9, fill: '#888' }, 'R^{1×nC}'));

  // RMSNorm + 线性投影 φ
  g.appendChild(eng.el('line', { x1: 190, y1: 70, x2: 210, y2: 70, stroke: '#888', 'stroke-width': 1.5, 'marker-end': 'url(#arrow)' }));
  g.appendChild(eng.el('rect', { x: 210, y: 50, width: 80, height: 40, rx: 4, fill: colors.pre + '15', stroke: colors.pre, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: 250, y: 68, 'text-anchor': 'middle', 'font-size': 10, fill: colors.text }, 'RMSNorm +'));
  g.appendChild(eng.el('text', { x: 250, y: 82, 'text-anchor': 'middle', 'font-size': 10, fill: colors.text }, 'φ 投影'));

  // 分出三路: H^pre, H^post, H^res
  const splitX = 310;
  g.appendChild(eng.el('line', { x1: 290, y1: 70, x2: splitX, y2: 70, stroke: '#888', 'stroke-width': 1.5 }));

  // H^pre (sigmoid)
  const preY = 40;
  g.appendChild(eng.el('line', { x1: splitX, y1: 70, x2: splitX, y2: preY + 10, stroke: colors.pre, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('rect', { x: splitX, y: preY, width: 70, height: 28, rx: 4, fill: colors.pre + '15', stroke: colors.pre, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: splitX + 35, y: 52, 'text-anchor': 'middle', 'font-size': 10, fill: colors.text }, 'σ(H̃^pre)'));
  g.appendChild(eng.el('text', { x: splitX + 35, y: 63, 'text-anchor': 'middle', 'font-size': 8, fill: '#888' }, '非负'));

  // H^post (2*sigmoid)
  const postY = 100;
  g.appendChild(eng.el('line', { x1: splitX, y1: 70, x2: splitX, y2: postY + 10, stroke: colors.post, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('rect', { x: splitX, y: postY, width: 70, height: 28, rx: 4, fill: colors.post + '15', stroke: colors.post, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: splitX + 35, y: 112, 'text-anchor': 'middle', 'font-size': 10, fill: colors.text }, '2σ(H̃^post)'));
  g.appendChild(eng.el('text', { x: splitX + 35, y: 123, 'text-anchor': 'middle', 'font-size': 8, fill: '#888' }, '非负'));

  // H^res (Sinkhorn-Knopp)
  const resY = 160;
  g.appendChild(eng.el('line', { x1: splitX, y1: 70, x2: splitX, y2: resY + 10, stroke: colors.res, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('rect', { x: splitX, y: resY, width: 70, height: 28, rx: 4, fill: colors.res + '15', stroke: colors.res, 'stroke-width': 2 }));
  g.appendChild(eng.el('text', { x: splitX + 35, y: 172, 'text-anchor': 'middle', 'font-size': 10, fill: colors.text }, 'SK(H̃^res)'));
  g.appendChild(eng.el('text', { x: splitX + 35, y: 183, 'text-anchor': 'middle', 'font-size': 8, fill: colors.res, 'font-weight': 600 }, '双随机!'));

  // H^pre · x_l → F 输入 (C 维)
  g.appendChild(eng.el('line', { x1: splitX + 70, y1: preY + 14, x2: 420, y2: 70, stroke: colors.pre, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: 400, y: 50, 'text-anchor': 'middle', 'font-size': 9, fill: colors.pre }, 'H^pre·x_l'));

  // F(x, W) 层函数
  g.appendChild(eng.el('rect', { x: 420, y: 55, width: 70, height: 30, rx: 4, fill: '#f3f4f6', stroke: colors.F, 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: 455, y: 74, 'text-anchor': 'middle', 'font-size': 11, fill: colors.text }, 'F(x, W)'));

  // H^post · F 输出
  g.appendChild(eng.el('line', { x1: 490, y1: 70, x2: 540, y2: postY + 14, stroke: colors.post, 'stroke-width': 1.5 }));

  // H^res · x_l (残差流混合)
  g.appendChild(eng.el('line', { x1: 80, y1: 120, x2: 540, y2: resY + 14, stroke: colors.res, 'stroke-width': 1.5, 'stroke-dasharray': '3,2' }));
  g.appendChild(eng.el('text', { x: 300, y: 135, 'text-anchor': 'middle', 'font-size': 9, fill: colors.res }, 'H^res·x_l (残差流混合)'));

  // 合并加号
  g.appendChild(eng.el('circle', { cx: 560, cy: 120, r: 14, fill: 'white', stroke: '#1a1a1a', 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: 560, y: 125, 'text-anchor': 'middle', 'font-size': 16, fill: '#1a1a1a' }, '+'));

  // 输出 x_{l+1}
  g.appendChild(eng.el('line', { x1: 574, y1: 120, x2: 600, y2: 120, stroke: '#1a1a1a', 'stroke-width': 1.5 }));
  g.appendChild(eng.el('text', { x: 640, y: 25, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: colors.stream }, 'x_{l+1} ∈ R^{n×C}'));
  for (let i = 0; i < n; i++) {
    const yi = 110 + i * 16;
    g.appendChild(eng.el('rect', { x: 600, y: yi, width: 40, height: 14, rx: 2, fill: colors.stream + '22', stroke: colors.stream, 'stroke-width': 1 }));
    g.appendChild(eng.el('text', { x: 620, y: yi + 11, 'text-anchor': 'middle', 'font-size': 8, fill: colors.text }, `s${i}'`));
  }

  // 数据流 packet 动画 - 在 H^res 路径上
  const flowT = (t * 2) % 1;
  if (flowT < 0.5) {
    const fx = eng.lerp(80, 540, flowT * 2);
    const fy = eng.lerp(120, resY + 14, flowT * 2);
    g.appendChild(eng.el('circle', { cx: fx, cy: fy, r: 4, fill: colors.res, opacity: 0.8 }));
  }

  // 底部公式
  g.appendChild(eng.el('rect', { x: 20, y: 220, width: 780, height: 40, rx: 6, fill: '#ede9fe', stroke: colors.res, 'stroke-width': 1 }));
  g.appendChild(eng.el('text', { x: 410, y: 245, 'text-anchor': 'middle', 'font-size': 13, fill: colors.text, 'font-weight': 600 },
    'x_{l+1} = P_M(H^res)·x_l + H^{post⊤}·F(H^pre·x_l, W_l)'));

  // 基础设施优化标签
  g.appendChild(eng.el('text', { x: 410, y: 290, 'text-anchor': 'middle', 'font-size': 12, fill: '#059669', 'font-weight': 600 }, '基础实施优化 (n=4, 仅 6.7% 额外开销)'));
  const optItems = ['Kernel Fusion (TileLang)', '选择性 Recomputing', 'DualPipe 通信重叠'];
  optItems.forEach((s, i) => {
    g.appendChild(eng.el('rect', { x: 100 + i * 220, y: 300, width: 200, height: 24, rx: 4, fill: '#d1fae5', stroke: '#059669', 'stroke-width': 1 }));
    g.appendChild(eng.el('text', { x: 200 + i * 220, y: 316, 'text-anchor': 'middle', 'font-size': 10, fill: '#059669' }, s));
  });

  svg.appendChild(g);
}

// ============================================================
// 场景 6: HC vs mHC 复合映射增益对比 (Amax Gain)
// ============================================================
function scene6_gain(eng) {
  const svg = eng.svg;
  svg.setAttribute('viewBox', '0 0 820 300');
  const t = eng.t;

  const g = eng.el('g');

  // 坐标轴
  const ax = { x: 60, y: 240, w: 700, h: 200 };
  g.appendChild(eng.el('line', { x1: ax.x, y1: ax.y, x2: ax.x + ax.w, y2: ax.y, stroke: '#333', 'stroke-width': 1.5 }));
  g.appendChild(eng.el('line', { x1: ax.x, y1: ax.y, x2: ax.x, y2: ax.y - ax.h, stroke: '#333', 'stroke-width': 1.5 }));

  // Y 轴 (log scale): 增益 0.1 ~ 10000
  g.appendChild(eng.el('text', { x: 30, y: 140, 'text-anchor': 'middle', 'font-size': 12, fill: '#333', transform: 'rotate(-90 30 140)' }, 'Amax 增益 (对数)'));
  const yTicks = [0.1, 1, 10, 100, 1000, 10000];
  yTicks.forEach(v => {
    const py = ax.y - (Math.log10(v) + 1) / 5 * ax.h;
    g.appendChild(eng.el('line', { x1: ax.x - 4, y1: py, x2: ax.x, y2: py, stroke: '#333', 'stroke-width': 1 }));
    g.appendChild(eng.el('text', { x: ax.x - 8, y: py + 4, 'text-anchor': 'end', 'font-size': 9, fill: '#666' }, v.toString()));
  });

  // X 轴: 层号 l (0 ~ L)
  const L = 60;
  g.appendChild(eng.el('text', { x: ax.x + ax.w/2, y: ax.y + 35, 'text-anchor': 'middle', 'font-size': 12, fill: '#333' }, '层深度 (l → L)'));
  for (let l = 0; l <= L; l += 10) {
    const px = ax.x + (l / L) * ax.w;
    g.appendChild(eng.el('line', { x1: px, y1: ax.y, x2: px, y2: ax.y + 4, stroke: '#333', 'stroke-width': 1 }));
    g.appendChild(eng.el('text', { x: px, y: ax.y + 16, 'text-anchor': 'middle', 'font-size': 9, fill: '#666' }, l.toString()));
  }

  // 理想线 y=1
  const idealY = ax.y - (Math.log10(1) + 1) / 5 * ax.h;
  g.appendChild(eng.el('line', { x1: ax.x, y1: idealY, x2: ax.x + ax.w, y2: idealY, stroke: '#059669', 'stroke-width': 1.5, 'stroke-dasharray': '5,3' }));
  g.appendChild(eng.el('text', { x: ax.x + ax.w + 5, y: idealY + 4, 'font-size': 9, fill: '#059669' }, '理想=1'));

  // HC 曲线: 指数增长 (有波动)
  let hcPath = '';
  for (let l = 0; l <= L; l++) {
    const px = ax.x + (l / L) * ax.w;
    const gain = Math.pow(1.15, l) * (1 + Math.sin(t * Math.PI * 2 + l * 0.2) * 0.2);
    const logGain = Math.log10(Math.max(0.1, gain));
    const py = ax.y - (logGain + 1) / 5 * ax.h;
    hcPath += (l === 0 ? 'M' : 'L') + ` ${px} ${py} `;
  }
  g.appendChild(eng.el('path', { d: hcPath, fill: 'none', stroke: '#d97706', 'stroke-width': 2.5 }));

  // mHC 曲线: 有界 (≈1.6)
  let mhcPath = '';
  for (let l = 0; l <= L; l++) {
    const px = ax.x + (l / L) * ax.w;
    const gain = 1 + 0.6 * (1 - Math.exp(-l / 15)) + Math.sin(t * Math.PI * 2 + l * 0.1) * 0.05;
    const logGain = Math.log10(Math.max(0.1, gain));
    const py = ax.y - (logGain + 1) / 5 * ax.h;
    mhcPath += (l === 0 ? 'M' : 'L') + ` ${px} ${py} `;
  }
  g.appendChild(eng.el('path', { d: mhcPath, fill: 'none', stroke: '#2563eb', 'stroke-width': 2.5 }));

  // 图例
  g.appendChild(eng.el('rect', { x: ax.x + ax.w - 180, y: 20, width: 170, height: 60, rx: 6, fill: 'white', stroke: '#e0e0e0', 'stroke-width': 1 }));
  g.appendChild(eng.el('line', { x1: ax.x + ax.w - 170, y1: 35, x2: ax.x + ax.w - 145, y2: 35, stroke: '#d97706', 'stroke-width': 2.5 }));
  g.appendChild(eng.el('text', { x: ax.x + ax.w - 140, y: 39, 'font-size': 11, fill: '#333' }, 'HC (无约束)'));
  g.appendChild(eng.el('line', { x1: ax.x + ax.w - 170, y1: 55, x2: ax.x + ax.w - 145, y2: 55, stroke: '#2563eb', 'stroke-width': 2.5 }));
  g.appendChild(eng.el('text', { x: ax.x + ax.w - 140, y: 59, 'font-size': 11, fill: '#333' }, 'mHC (双随机)'));

  // 标注 HC 峰值
  const peakL = L;
  const peakGain = Math.pow(1.15, peakL);
  const peakPx = ax.x + (peakL / L) * ax.w;
  const peakPy = ax.y - (Math.log10(peakGain) + 1) / 5 * ax.h;
  g.appendChild(eng.el('circle', { cx: peakPx, cy: peakPy, r: 4, fill: '#dc2626' }));
  g.appendChild(eng.el('text', { x: peakPx - 10, y: peakPy - 8, 'text-anchor': 'middle', 'font-size': 10, fill: '#dc2626', 'font-weight': 700 }, `≈3000`));

  // 标注 mHC 峰值
  const mhcPeakY = ax.y - (Math.log10(1.6) + 1) / 5 * ax.h;
  g.appendChild(eng.el('text', { x: peakPx - 10, y: mhcPeakY - 8, 'text-anchor': 'middle', 'font-size': 10, fill: '#2563eb', 'font-weight': 700 }, `≈1.6`));

  g.appendChild(eng.el('text', { x: 410, y: 285, 'text-anchor': 'middle', 'font-size': 12, fill: '#333' }, 'HC: 峰值≈3000 (爆炸)  |  mHC: 峰值≈1.6 (有界, 降低 3 个数量级)'));

  svg.appendChild(g);
}

// ============================================================
// 初始化所有动画
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const configs = [
    { id: 'anim1', scenes: { 'compare': scene1_compare } },
    { id: 'anim2', scenes: { 'instability': scene2_instability } },
    { id: 'anim3', scenes: { 'birkhoff': scene3_birkhoff } },
    { id: 'anim4', scenes: { 'sinkhorn': scene4_sinkhorn } },
    { id: 'anim5', scenes: { 'forward': scene5_forward } },
    { id: 'anim6', scenes: { 'gain': scene6_gain } },
  ];

  configs.forEach(cfg => {
    const root = document.getElementById(cfg.id);
    if (!root) return;
    const eng = new AnimEngine(root);
    Object.entries(cfg.scenes).forEach(([name, fn]) => eng.registerScene(name, fn));
    // 所有 scene 注册完成后, 强制渲染初始帧 (不依赖 IntersectionObserver)
    eng.initDefaultScene();
    // 进入视口时自动播放
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { eng.play(); }
        else { eng.pause(); }
      });
    }, { threshold: 0.3 });
    observer.observe(root);
  });
});
