/* 动画⑤ Markov 低秩偏置 — VxV 转移表到 W1/W2 再到 logits 修正 */
(function () {
  function svgFactory() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 900 380");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML =
      '<marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#818b98"/></marker>';
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
    const matrix = { x: 35, y: 62, w: 210, h: 150 };
    const w1 = { x: 330, y: 72, w: 76, h: 150 };
    const w2 = { x: 495, y: 72, w: 210, h: 150 };
    const rows = ["of", "course", "problem", "..."];
    const cols = ["course", "problem", "the", "..."];

    function label(e, x, y, text, fill, weight, size) {
      return e.draw("text", {
        x: x, y: y, "text-anchor": "middle",
        "font-size": size || 12, "font-weight": weight || 600,
        fill: fill || "#1f2328"
      }, text);
    }

    function rectLabel(e, x, y, w, h, text, fill, stroke, textFill) {
      e.draw("rect", { x: x, y: y, width: w, height: h, rx: 6, fill: fill, stroke: stroke, "stroke-width": 1.4 });
      label(e, x + w / 2, y + h / 2 + 4, text, textFill || stroke, 700, 12);
    }

    function arrow(e, x1, y1, x2, y2, color) {
      e.draw("path", {
        d: "M " + x1 + " " + y1 + " L " + x2 + " " + y2,
        stroke: color || "#818b98", "stroke-width": 1.8,
        fill: "none", "marker-end": "url(#arrowhead)"
      });
    }

    function drawFrame(e, title, subtitle) {
      e.clear();
      label(e, 450, 26, title, "#1f2328", 750, 16);
      if (subtitle) label(e, 450, 46, subtitle, "#57606a", 500, 11);
    }

    function drawFullMatrix(e, highlight) {
      e.draw("rect", { x: matrix.x, y: matrix.y, width: matrix.w, height: matrix.h, rx: 8, fill: "#f6f8fa", stroke: "#d0d7de" });
      label(e, matrix.x + matrix.w / 2, matrix.y - 13, "完整转移矩阵 B (V x V)", "#57606a", 700, 12);
      const cellW = 46, cellH = 25;
      rows.forEach(function (r, i) {
        label(e, matrix.x + 22, matrix.y + 31 + i * cellH, r, "#57606a", 600, 10);
      });
      cols.forEach(function (c, j) {
        label(e, matrix.x + 69 + j * cellW, matrix.y + 15, c, "#57606a", 600, 9);
      });
      const vals = [
        ["+2.3", "-1.8", "+0.1", "..."],
        ["?", "?", "?", "..."],
        ["?", "?", "?", "..."],
        ["...", "...", "...", "..."]
      ];
      for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < cols.length; j++) {
          const x = matrix.x + 46 + j * cellW;
          const y = matrix.y + 22 + i * cellH;
          const isHot = highlight && i === 0;
          const fill = isHot ? (j === 0 ? "#dafbe1" : j === 1 ? "#ffebe9" : "#fff8c5") : "#ffffff";
          const stroke = isHot ? (j === 0 ? "#1a7f37" : j === 1 ? "#cf222e" : "#9a6700") : "#d0d7de";
          e.draw("rect", { x: x, y: y, width: cellW - 4, height: cellH - 4, rx: 3, fill: fill, stroke: stroke, opacity: isHot ? 1 : 0.8 });
          label(e, x + (cellW - 4) / 2, y + 15, vals[i][j], stroke, 650, 9);
        }
      }
    }

    function drawLowRank(e, active) {
      rectLabel(e, w1.x, w1.y, w1.w, w1.h, "W1", active ? "#ddf4ff" : "#f6f8fa", active ? "#0969da" : "#d0d7de");
      label(e, w1.x + w1.w / 2, w1.y + w1.h + 18, "V x r", "#57606a", 600, 11);
      rectLabel(e, w2.x, w2.y, w2.w, w2.h, "W2", active ? "#fbefff" : "#f6f8fa", active ? "#8250df" : "#d0d7de");
      label(e, w2.x + w2.w / 2, w2.y + w2.h + 18, "r x V", "#57606a", 600, 11);
      label(e, 452, 150, "x", "#57606a", 800, 20);
      label(e, 450, 252, "B ≈ W1 x W2", "#1f2328", 750, 15);
      label(e, 450, 274, "225 亿参数 → 约 7680 万参数 (r=256)", "#1a7f37", 700, 12);
    }

    function drawVectorProjection(e, withBias) {
      rectLabel(e, 48, 122, 74, 34, 'prev="of"', "#fff8c5", "#9a6700");
      arrow(e, 126, 139, 198, 139, "#818b98");
      rectLabel(e, 205, 94, 96, 90, 'W1["of"]', "#ddf4ff", "#0969da");
      const vals = ["0.8", "-0.3", "0.5", "0.1"];
      vals.forEach(function (v, i) {
        e.draw("rect", { x: 226 + i * 16, y: 202, width: 12, height: 30 + i * 9, fill: "#0969da", opacity: 0.18 + i * 0.12 });
      });
      label(e, 253, 258, "256 维名片", "#0969da", 700, 11);
      arrow(e, 306, 139, 392, 139, "#818b98");
      rectLabel(e, 400, 94, 100, 90, "W2 投影", "#fbefff", "#8250df");
      arrow(e, 506, 139, 594, 139, "#818b98");
      if (withBias) {
        drawBiasBars(e, {
          x: 610, y: 70, width: 245, title: "Markov bias",
          vals: [2.3, -1.8, 0.1, -3.2],
          names: ["course", "problem", "the", "quantum"],
          scale: 28
        });
      }
    }

    function drawBiasBars(e, opts) {
      const x = opts.x, y = opts.y, vals = opts.vals, names = opts.names;
      const width = opts.width || 220;
      const scale = opts.scale || 24;
      const axisX = x + Math.floor(width * 0.57);
      const nameX = x + 32;
      label(e, x + width / 2, y - 14, opts.title, "#57606a", 700, 12);
      e.draw("line", {
        x1: axisX, y1: y + 9, x2: axisX, y2: y + 176,
        stroke: "#d0d7de", "stroke-width": 1.2
      });
      vals.forEach(function (v, i) {
        const baseY = y + 26 + i * 42;
        const color = v >= 0 ? "#1a7f37" : "#cf222e";
        e.draw("text", {
          x: nameX, y: baseY + 5, "text-anchor": "end",
          "font-size": 10, "font-weight": 650, fill: "#57606a"
        }, names[i]);
        const bw = Math.max(4, Math.abs(v) * scale);
        const barX = v >= 0 ? axisX : axisX - bw;
        e.draw("rect", {
          x: barX, y: baseY - 9,
          width: bw, height: 16, rx: 3, fill: color, opacity: 0.82
        });
        e.draw("text", {
          x: v >= 0 ? axisX + bw + 7 : axisX - bw - 7,
          y: baseY + 5,
          "text-anchor": v >= 0 ? "start" : "end",
          "font-size": 10, "font-weight": 750, fill: color
        }, (v > 0 ? "+" : "") + v.toFixed(1));
      });
    }

    function drawFinalLogits(e) {
      drawBiasBars(e, {
        x: 55, y: 82, width: 190, title: "base logits",
        vals: [1.0, 0.9], names: ["course", "problem"], scale: 30
      });
      label(e, 275, 150, "+", "#57606a", 800, 22);
      drawBiasBars(e, {
        x: 305, y: 82, width: 210, title: "markov bias",
        vals: [2.3, -1.8], names: ["course", "problem"], scale: 28
      });
      label(e, 545, 150, "=", "#57606a", 800, 22);
      drawBiasBars(e, {
        x: 575, y: 82, width: 230, title: "corrected logits",
        vals: [3.3, -0.9], names: ["course", "problem"], scale: 24
      });
      e.draw("rect", { x: 620, y: 270, width: 150, height: 42, rx: 8, fill: "#dafbe1", stroke: "#1a7f37", "stroke-width": 2 });
      label(e, 695, 295, 'sample: "course"', "#1a7f37", 800, 13);
    }

    return [
      { title: "Step 0: 完整一阶转移表", desc: "B[i][j] 记录 prev=i 时对 next=j 的偏置",
        render(e) {
          drawFrame(e, "完整 V x V 转移表", "每个前驱 token 都有一整行后继偏好");
          drawFullMatrix(e, true);
          label(e, 380, 260, "问题: V≈15万 → V²≈225亿参数", "#cf222e", 800, 15);
        }
      },
      { title: "Step 1: 低秩分解压缩", desc: "用 W1/W2 近似完整 B",
        render(e) {
          drawFrame(e, "低秩分解: B ≈ W1 x W2", "把巨大的搭配表拆成 token 名片 + 共享解读器");
          drawFullMatrix(e, false);
          label(e, 287, 150, "≈", "#57606a", 800, 22);
          drawLowRank(e, true);
        }
      },
      { title: "Step 2: 查 W1[of]", desc: "前一个 token 只选择 W1 的一行",
        render(e) {
          drawFrame(e, 'prev token 是 "of"', "VanillaMarkov 不看 hidden,只查前一个 token 的低维向量");
          drawVectorProjection(e, false);
          e.flyPacket("lookup", 76, 160, 212, 116, "of", "#fff8c5", "#9a6700");
        }
      },
      { title: "Step 3: W2 投影成词表 bias", desc: "256 维名片被 W2 翻译成 V 维 logit bias",
        render(e) {
          drawFrame(e, "W2 投影: 低维向量 → V 维 bias", '"course" 加分,"problem" 减分');
          drawVectorProjection(e, true);
          e.flyPacket("proj", 505, 124, 604, 124, "W2", "#fbefff", "#8250df");
        }
      },
      { title: "Step 4: 与 base logits 相加", desc: "最终采样看 corrected logits",
        render(e) {
          drawFrame(e, "base logits + markov bias = corrected logits", '局部搭配把 "course" 从微弱领先推成明显优势');
          drawFinalLogits(e);
        }
      }
    ];
  }

  if (window.AnimEngine) {
    window.AnimEngine.register("markov-low-rank", svgFactory, buildSteps);
  }
})();
