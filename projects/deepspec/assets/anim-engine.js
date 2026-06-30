/* DeepSpec 交互式 SVG 动画引擎 — 纯 stdlib,无依赖
 * 升级自 Flash Attention 项目的 AnimEngine:
 *   - IIFE → 显式 window.AnimEngine 导出
 *   - tween CSS 选择器 [data-svg] → .anim-stage svg
 *   - 新增原语: highlightRow / rollNumber / branchArrow
 */
"use strict";

// ============ 通用动画引擎 ============
window.AnimEngine = class AnimEngine {
  constructor(svgRoot, opts) {
    this.svg = svgRoot;
    this.steps = opts.steps || [];
    this.onStepChange = opts.onStepChange || function () {};
    this.idx = -1;
    this.timer = null;
    this.playing = false;
    this.speed = 1; // 1 = normal, 2 = fast, 0.5 = slow
    this._css = null; // 注入的过渡 CSS
  }

  // ---------- 基础工具 ----------
  ns(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }
  clear() {
    const dyn = this.svg.querySelector("#dynamic");
    if (dyn) while (dyn.firstChild) dyn.removeChild(dyn.firstChild);
  }
  el(id) { return this.svg.querySelector("#" + id) || this.svg.getElementById(id); }
  setAttrs(node, attrs) {
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }
  add(parent, tag, attrs, text) {
    const n = this.ns(tag);
    if (attrs) this.setAttrs(n, attrs);
    if (text != null) n.textContent = text;
    parent.appendChild(n);
    return n;
  }
  draw(tag, attrs, text) {
    const dyn = this.svg.querySelector("#dynamic") || this.svg;
    return this.add(dyn, tag, attrs, text);
  }
  update(id, attrs, text) {
    const n = typeof id === "string" ? this.el(id) : id;
    if (!n) return null;
    if (attrs) this.setAttrs(n, attrs);
    if (text != null) n.textContent = text;
    return n;
  }
  delay() { return (1100 / this.speed); } // 略慢,给过渡留时间

  // ---------- 连续过渡能力 ----------
  // 注入过渡 CSS(仅一次),让带 .tween class 的元素属性变化自动平滑过渡
  ensureTweenCSS() {
    if (this._css) return;
    const dur = (0.6 / this.speed).toFixed(2) + "s";
    const style = document.createElement("style");
    style.textContent = ".anim-stage svg .tween {" +
      "transition: transform " + dur + " ease-in-out, " +
      "x " + dur + " ease-in-out, y " + dur + " ease-in-out, " +
      "cx " + dur + " ease-in-out, cy " + dur + " ease-in-out, " +
      "width " + dur + " ease-in-out, height " + dur + " ease-in-out, " +
      "opacity " + dur + " ease-in-out, fill " + dur + " ease-in-out;" +
      "} .anim-stage svg .tween-fast { transition-duration: " + (0.25 / this.speed).toFixed(2) + "s; }";
    this.svg.closest(".anim-stage svg") || this.svg;
    document.head.appendChild(style);
    this._css = style;
  }

  // 飞行数据包:创建一个会沿路径移动的元素,带 tween
  // move(id, toX, toY) 会平滑过渡
  flyPacket(id, fromX, fromY, toX, toY, label, fill, stroke) {
    const p = this.draw("g", { id: id, class: "tween" });
    this.add(p, "rect", {
      x: fromX, y: fromY, width: 40, height: 24, rx: 4,
      fill: fill || "#ffe8a3", stroke: stroke || "#9a6700", "stroke-width": 1.5
    });
    if (label) this.add(p, "text", {
      x: fromX + 20, y: fromY + 16, "text-anchor": "middle",
      "font-size": 11, "font-weight": 600, fill: stroke || "#9a6700"
    }, label);
    // 触发过渡:下一帧改 transform
    requestAnimationFrame(() => {
      p.style.transform = "translate(" + (toX - fromX) + "px," + (toY - fromY) + "px)";
    });
    return p;
  }

  // 平滑移动已有元素到新位置(通过 transform)
  move(id, toX, toY) {
    const n = typeof id === "string" ? this.el(id) : id;
    if (!n) return;
    if (!n.classList.contains("tween")) n.classList.add("tween");
    // 获取当前 transform 基准(若已有则累计)
    n.style.transform = "translate(" + toX + "px," + toY + "px)";
  }

  // 数值跳动:更新文本时给一个"弹跳"效果
  pulseText(id, newText) {
    const n = typeof id === "string" ? this.el(id) : id;
    if (!n) return;
    n.textContent = newText;
    n.classList.remove("num-pulse");
    void n.offsetWidth; // 强制重排重启动画
    n.classList.add("num-pulse");
  }

  // IO 计数器:创建/更新一个计数器显示
  // counter(id, x, y, label) 创建; counterInc(id) +1 并 pulse
  counter(id, x, y, label) {
    const g = this.draw("g", { id: id });
    this.add(g, "rect", {
      x: x, y: y, width: 90, height: 36, rx: 6,
      fill: "#ffebe9", stroke: "#cf222e", "stroke-width": 1.5
    });
    this.add(g, "text", {
      id: id + "-label", x: x + 8, y: y + 15,
      "font-size": 9, fill: "#cf222e", "font-weight": 600
    }, label || "HBM IO");
    this.add(g, "text", {
      id: id + "-val", x: x + 82, y: y + 28,
      "text-anchor": "end", "font-size": 18, "font-weight": 800, fill: "#cf222e",
      class: "num-pulse-target"
    }, "0");
    return g;
  }
  counterSet(id, val) {
    this.pulseText(id + "-val", String(val));
  }
  counterInc(id) {
    const n = this.el(id + "-val");
    if (!n) return;
    const cur = parseInt(n.textContent) || 0;
    this.pulseText(id + "-val", String(cur + 1));
  }

  // 闪烁高亮(强调某个元素)
  highlight(id, on) {
    const n = typeof id === "string" ? this.el(id) : id;
    if (!n) return;
    if (on) { n.classList.add("flash-highlight"); }
    else { n.classList.remove("flash-highlight"); }
  }

  // ---------- 新增原语 (deepspec 场景) ----------

  // 高亮表格某行:在行背景覆盖一个 rect
  highlightRow(rowBgId, color, opacity) {
    const n = typeof rowBgId === "string" ? this.el(rowBgId) : rowBgId;
    if (!n) return;
    if (!n.classList.contains("tween")) n.classList.add("tween");
    n.setAttribute("fill", color || "#dafbe1");
    n.setAttribute("opacity", opacity != null ? opacity : "0.6");
  }

  // 数值平滑滚动:从当前值插值到 toVal (~400ms)
  rollNumber(id, toVal, fmt) {
    const n = typeof id === "string" ? this.el(id) : id;
    if (!n) return;
    const fromVal = parseFloat(n.textContent) || 0;
    const start = performance.now();
    const dur = 400 / this.speed;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = fromVal + (toVal - fromVal) * (1 - Math.pow(1 - t, 3)); // ease-out cubic
      n.textContent = fmt ? fmt(v) : v.toFixed(2);
      if (t < 1) requestAnimationFrame(step);
      else n.textContent = fmt ? fmt(toVal) : toVal.toFixed(2);
    };
    requestAnimationFrame(step);
  }

  // 带标签的弯曲箭头(早停分支用)
  branchArrow(fromX, fromY, toX, toY, label, color, id) {
    const g = this.draw("g", { id: id || null, class: "tween" });
    const mx = (fromX + toX) / 2, my = (fromY + toY) / 2 - 20;
    const d = "M " + fromX + " " + fromY + " Q " + mx + " " + my + " " + toX + " " + toY;
    this.add(g, "path", {
      d: d, fill: "none", stroke: color || "#9a6700",
      "stroke-width": 2, "stroke-dasharray": "5,3",
      "marker-end": "url(#arrowhead-warn)"
    });
    if (label) {
      this.add(g, "text", {
        x: mx, y: my - 4, "text-anchor": "middle",
        "font-size": 11, "font-weight": 600, fill: color || "#9a6700"
      }, label);
    }
    return g;
  }

  // ---------- 播放控制(不变) ----------
  goTo(i) {
    this.idx = Math.max(-1, Math.min(this.steps.length - 1, i));
    this.render();
    this.onStepChange(this.idx, this.steps[this.idx]);
  }
  next() {
    if (this.idx < this.steps.length - 1) this.goTo(this.idx + 1);
    else this.pause();
  }
  prev() {
    if (this.idx >= 0) this.goTo(this.idx - 1);
  }
  reset() {
    this.pause();
    this.goTo(-1);
  }
  play() {
    if (this.idx >= this.steps.length - 1) this.goTo(-1);
    this.playing = true;
    const tick = () => {
      if (!this.playing) return;
      if (this.idx < this.steps.length - 1) {
        this.next();
        this.timer = setTimeout(tick, this.delay());
      } else {
        this.playing = false;
      }
    };
    tick();
  }
  pause() {
    this.playing = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
  toggle() {
    if (this.playing) this.pause(); else this.play();
  }
  setSpeed(s) {
    this.speed = s;
    // 更新过渡时长
    if (this._css) {
      const dur = (0.6 / s).toFixed(2) + "s";
      this._css.textContent = this._css.textContent.replace(/transition-duration:[^;]+;/, "");
      // 简单重建
      this._css.remove();
      this._css = null;
      this.ensureTweenCSS();
    }
  }
  render() {
    const cur = this.steps[this.idx];
    if (cur && typeof cur.render === "function") {
      this.ensureTweenCSS();
      cur.render(this);
    } else if (!cur) {
      this.clear();
    }
  }
};

// ============ 场景注册表 + 惰性初始化 ============
// 场景注册表
window.AnimEngine.registry = {};
window.AnimEngine.register = function (name, svgFactory, stepsBuilder) {
  window.AnimEngine.registry[name] = { svgFactory, stepsBuilder };
};
// 扫描所有 [data-anim] 并惰性初始化
window.AnimEngine.initAll = function () {
  const stages = document.querySelectorAll(".anim-stage[data-anim]");
  const engines = {};
  function initStage(stage) {
    const name = stage.getAttribute("data-anim");
    const reg = window.AnimEngine.registry[name];
    if (!reg) return null;
    // 清空 stage 内容,注入 SVG + 控件
    stage.innerHTML = "";
    const svg = reg.svgFactory();
    if (!svg.getAttribute("viewBox")) {
      svg.setAttribute("viewBox", "0 0 720 360"); // 默认,仅当场景 svgFactory 未设时用
    }
    svg.setAttribute("class", "anim-svg");
    stage.appendChild(svg);
    // 控件栏
    const ctrl = document.createElement("div");
    ctrl.className = "anim-ctrl";
    ctrl.innerHTML =
      '<button class="btn-play">▶ 播放</button>' +
      '<button class="btn-prev">◀ 上一步</button>' +
      '<button class="btn-next">下一步 ▶</button>' +
      '<button class="btn-reset">重置</button>' +
      '<span class="step-label">0 / 0</span>';
    stage.appendChild(ctrl);
    const steps = reg.stepsBuilder();
    const eng = new window.AnimEngine(svg, {
      steps: steps,
      onStepChange: function (idx, step) {
        const label = stage.querySelector(".step-label");
        const playBtn = stage.querySelector(".btn-play");
        if (label) label.textContent = (idx + 1) + " / " + steps.length;
        if (playBtn) playBtn.textContent = eng.playing ? "⏸ 暂停" : "▶ 播放";
      }
    });
    engines[name] = eng;
    // 控件事件
    ctrl.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t.classList.contains("btn-play")) eng.toggle();
      else if (t.classList.contains("btn-next")) eng.next();
      else if (t.classList.contains("btn-prev")) eng.prev();
      else if (t.classList.contains("btn-reset")) eng.reset();
    });
    return eng;
  }
  // 强制首屏 draw(防 headless 空白):对可见的 stage 立即初始化
  stages.forEach(function (stage) {
    const rect = stage.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const eng = initStage(stage);
      if (eng && eng.idx === -1) eng.goTo(0);
    }
  });
  // IntersectionObserver:进视口才初始化不可见的
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const stage = entry.target;
        const name = stage.getAttribute("data-anim");
        if (!engines[name]) {
          const eng = initStage(stage);
          if (eng && eng.idx === -1) eng.goTo(0);
        }
      }
    });
  }, { rootMargin: "-10% 0px -30% 0px", threshold: 0 });
  stages.forEach(function (s) { io.observe(s); });
};
// DOMContentLoaded 时启动
document.addEventListener("DOMContentLoaded", function () {
  if (typeof mermaid !== "undefined") {
    // 等 mermaid 先初始化,再扫 anim-stage
    setTimeout(window.AnimEngine.initAll, 300);
  } else {
    window.AnimEngine.initAll();
  }
});
