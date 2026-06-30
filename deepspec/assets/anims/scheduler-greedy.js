/* 动画⑥ 调度器贪心搜索 — 逐个 admit + Φ 曲线爬升 + 早停 */
(function () {
  function svgFactory() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 420");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML =
      '<marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#818b98"/></marker>' +
      '<marker id="arrowhead-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#9a6700"/></marker>';
    svg.appendChild(defs);
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "g");
    bg.setAttribute("id", "static");
    svg.appendChild(bg);
    const dyn = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dyn.setAttribute("id", "dynamic");
    svg.appendChild(dyn);
    return svg;
  }

  function buildSteps() {
    // 候选表数据(按 ρ 降序,示意值)
    const rows = [
      { req: "req2,k=3", rho: 0.91 },
      { req: "req1,k=2", rho: 0.85 },
      { req: "req1,k=3", rho: 0.78 },
      { req: "req3,k=1", rho: 0.72 },
      { req: "req2,k=4", rho: 0.61 },
      { req: "req1,k=4", rho: 0.45 }
    ];
    const TABLE_X = 20, TABLE_Y = 50, ROW_H = 32;
    // Φ 曲线区域
    const CHART_X = 360, CHART_Y = 50, CHART_W = 260, CHART_H = 240;

    function drawBase(e) {
      e.clear();
      // 左侧表头
      e.draw("rect", { x: TABLE_X, y: TABLE_Y - 20, width: 320, height: ROW_H, fill: "#eaeef2", stroke: "#d0d7de" });
      e.draw("text", { x: TABLE_X + 80, y: TABLE_Y, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#1f2328" }, "候选 (按 ρ 降序)" );
      e.draw("text", { x: TABLE_X + 200, y: TABLE_Y, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#1f2328" }, "ρ" );
      e.draw("text", { x: TABLE_X + 280, y: TABLE_Y, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#1f2328" }, "状态" );
      // 表行
      rows.forEach(function (r, i) {
        const y = TABLE_Y + 12 + i * ROW_H;
        e.draw("rect", { id: "row-bg-" + i, x: TABLE_X, y: y, width: 320, height: ROW_H - 2, fill: "#ffffff", stroke: "#eaeef2" });
        e.draw("text", { x: TABLE_X + 80, y: y + 20, "text-anchor": "middle", "font-size": 11, fill: "#1f2328" }, r.req);
        e.draw("text", { x: TABLE_X + 200, y: y + 20, "text-anchor": "middle", "font-size": 11, fill: "#57606a" }, r.rho.toFixed(2) );
        e.draw("text", { id: "row-status-" + i, x: TABLE_X + 280, y: y + 20, "text-anchor": "middle", "font-size": 11, fill: "#818b98" }, "◌" );
      });
      // 右侧坐标轴
      e.draw("path", { d: "M " + CHART_X + " " + (CHART_Y + CHART_H) + " L " + CHART_X + " " + CHART_Y + " L " + (CHART_X + CHART_W) + " " + CHART_Y, stroke: "#57606a", "stroke-width": 1.5, fill: "none" });
      e.draw("text", { x: CHART_X + CHART_W/2, y: CHART_Y + CHART_H + 20, "text-anchor": "middle", "font-size": 11, fill: "#57606a" }, "B (批大小)" );
      e.draw("text", { x: CHART_X - 25, y: CHART_Y + CHART_H/2, "text-anchor": "middle", "font-size": 11, fill: "#57606a", transform: "rotate(-90 " + (CHART_X - 25) + " " + (CHART_Y + CHART_H/2) + ")" }, "Φ = A·SPS(B)" );
      // 状态栏
      e.draw("rect", { x: TABLE_X, y: 360, width: 600, height: 40, rx: 4, fill: "#f6f8fa", stroke: "#d0d7de" });
      e.draw("text", { id: "state-bar", x: TABLE_X + 300, y: 385, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "#1f2328" }, "B=0  A=0  Φ=0  best=0" );
    }

    // Φ 曲线点(示意,随 admit 累计)
    const phiPts = [
      { b: 1, phi: 0.91 }, { b: 2, phi: 1.76 }, { b: 3, phi: 2.54 }, { b: 4, phi: 3.26 }, { b: 5, phi: 3.10 }
    ];

    function drawCurve(e, upToIdx) {
      if (upToIdx < 0) return;
      let d = "";
      for (let i = 0; i <= upToIdx && i < phiPts.length; i++) {
        const p = phiPts[i];
        const x = CHART_X + (p.b / 6) * CHART_W;
        const y = CHART_Y + CHART_H - (p.phi / 4) * CHART_H;
        d += (i === 0 ? "M " : " L ") + x + " " + y;
        e.draw("circle", { cx: x, cy: y, r: 3, fill: i === upToIdx ? "#cf222e" : "#0969da" });
      }
      e.draw("path", { d: d, stroke: "#0969da", "stroke-width": 2, fill: "none" });
      // best 标记
      const bestIdx = phiPts.slice(0, upToIdx + 1).reduce(function (acc, p, i) { return p.phi > phiPts[acc].phi ? i : acc; }, 0);
      const bp = phiPts[bestIdx];
      const bx = CHART_X + (bp.b / 6) * CHART_W, by = CHART_Y + CHART_H - (bp.phi / 4) * CHART_H;
      e.draw("text", { x: bx, y: by - 8, "text-anchor": "middle", "font-size": 9, fill: "#1a7f37", "font-weight": 700 }, "best");
    }

    const steps = [
      { title: "初始: 表全灰, Φ 曲线空", desc: "状态 B=0 A=0 Φ=0 best=0",
        render(e) { drawBase(e); }
      },
      { title: "Step 1: 全局排序确认", desc: "候选按 ρ 降序已排好,逐行刷一遍",
        render(e) {
          drawBase(e);
          rows.forEach(function (r, i) {
            e.highlightRow("row-bg-" + i, "#fff8c5", 0.4);
          });
        }
      },
      { title: "Step 2: admit (req2,k=3) ρ=0.91", desc: "B→1, A→0.91, Φ 上升",
        render(e) {
          drawBase(e);
          e.highlightRow("row-bg-0", "#dafbe1", 0.6);
          e.update("row-status-0", {}, "✓");
          e.rollNumber("state-bar", 0.91, function (v) { return "B=1  A=" + v.toFixed(2) + "  Φ=" + v.toFixed(2) + "  best=" + v.toFixed(2); });
          drawCurve(e, 0);
        }
      },
      { title: "Step 3: admit (req1,k=2) ρ=0.85", desc: "B→2, A→1.76, Φ 继续上升",
        render(e) {
          drawBase(e);
          e.highlightRow("row-bg-0", "#dafbe1", 0.6); e.update("row-status-0", {}, "✓");
          e.highlightRow("row-bg-1", "#dafbe1", 0.6); e.update("row-status-1", {}, "✓");
          e.rollNumber("state-bar", 1.76, function (v) { return "B=2  A=" + v.toFixed(2) + "  Φ=" + v.toFixed(2) + "  best=" + v.toFixed(2); });
          drawCurve(e, 1);
        }
      },
      { title: "Step 4: admit (req1,k=3) ρ=0.78 — 斜率变缓", desc: "SPS 开始下行,Φ 增长放缓",
        render(e) {
          drawBase(e);
          [0,1,2].forEach(function (i) { e.highlightRow("row-bg-" + i, "#dafbe1", 0.6); e.update("row-status-" + i, {}, "✓"); });
          e.rollNumber("state-bar", 2.54, function (v) { return "B=3  A=" + v.toFixed(2) + "  Φ=" + v.toFixed(2) + "  best=" + v.toFixed(2); });
          drawCurve(e, 2);
        }
      },
      { title: "Step 5: admit (req3,k=1) ρ=0.72 — Φ 到峰值", desc: "best 标记当前最高 Φ",
        render(e) {
          drawBase(e);
          [0,1,2,3].forEach(function (i) { e.highlightRow("row-bg-" + i, "#dafbe1", 0.6); e.update("row-status-" + i, {}, "✓"); });
          e.rollNumber("state-bar", 3.26, function (v) { return "B=4  A=" + v.toFixed(2) + "  Φ=" + v.toFixed(2) + "  best=" + v.toFixed(2); });
          drawCurve(e, 3);
        }
      },
      { title: "Step 6: 尝试 (req2,k=4) ρ=0.61 — Φ 下降! 早停 break", desc: "Φ<best → break, 返回 best 对应 ℓ",
        render(e) {
          drawBase(e);
          [0,1,2,3].forEach(function (i) { e.highlightRow("row-bg-" + i, "#dafbe1", 0.6); e.update("row-status-" + i, {}, "✓"); });
          // 第5行闪黄
          e.highlightRow("row-bg-4", "#fff8c5", 0.7);
          e.update("row-status-4", { fill: "#9a6700" }, "⚠");
          drawCurve(e, 4); // 第5个点 Φ 下降
          // branchArrow: 从第5行指向曲线下降点
          e.branchArrow(TABLE_X + 320, TABLE_Y + 12 + 4 * ROW_H + 15, CHART_X + (5/6) * CHART_W, CHART_Y + CHART_H - (3.10/4) * CHART_H, "Φ<best → break", "#9a6700", "branch");
          e.update("state-bar", {}, "B=5  Φ=3.10 < best=3.26 → break! 返回 ℓ₁..ℓ₄");
        }
      }
    ];
    return steps;
  }

  if (window.AnimEngine) {
    window.AnimEngine.register("scheduler-greedy", svgFactory, buildSteps);
  }
})();
