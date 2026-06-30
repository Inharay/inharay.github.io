/* 动画④ 两段式生成节奏对比 — 并行同时 vs 串行逐个 */
(function () {
  function svgFactory() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 760 280");
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
    const UP_Y = 60, DOWN_Y = 170;

    function drawBase(e) {
      e.clear();
      // 上行容器:并行段
      e.draw("rect", { x: 20, y: UP_Y - 20, width: 720, height: 80, rx: 8, fill: "#f6f8fa", stroke: "#d0d7de", "stroke-dasharray": "5,3" });
      e.draw("text", { x: 380, y: UP_Y - 5, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "#0969da" }, "并行段 Parallel (1 次前向)");
      // 下行容器:串行段
      e.draw("rect", { x: 20, y: DOWN_Y - 20, width: 720, height: 100, rx: 8, fill: "#f6f8fa", stroke: "#d0d7de", "stroke-dasharray": "5,3" });
      e.draw("text", { x: 380, y: DOWN_Y - 5, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "#1a7f37" }, "串行段 Sequential (γ 次循环)");
    }

    const steps = [
      { title: "初始: 两段式结构", desc: "上行并行段,下行串行段",
        render(e) { drawBase(e); }
      },
      { title: "Step 1: 并行段 — 4 logits 同时亮", desc: "一次前向,所有位置同一帧出现",
        render(e) {
          drawBase(e);
          for (let i = 0; i < 4; i++) {
            e.draw("rect", { x: 80 + i*150, y: UP_Y + 15, width: 120, height: 35, rx: 4, fill: "#ddf4ff", stroke: "#0969da", "stroke-width": 1.5, class: "tween" });
            e.draw("text", { x: 140 + i*150, y: UP_Y + 37, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "#0969da" }, "base_logits" + (i+1));
          }
          e.draw("rect", { x: 60, y: UP_Y + 10, width: 640, height: 45, rx: 4, fill: "none", stroke: "#0969da", "stroke-dasharray": "3,2", opacity: 0.5 });
          e.draw("text", { x: 380, y: UP_Y + 72, "text-anchor": "middle", "font-size": 11, fill: "#0969da", "font-weight": 600 }, "← 1 forward pass, 同时产出 →");
        }
      },
      { title: "Step 2: 并行的问题 — 后段衰减", desc: "每个位置边际化所有前驱 → 多模态碰撞",
        render(e) {
          drawBase(e);
          for (let i = 0; i < 4; i++) {
            const dim = i >= 1; // 后段变灰
            e.draw("rect", { x: 80 + i*150, y: UP_Y + 15, width: 120, height: 35, rx: 4, fill: dim ? "#f6f8fa" : "#ddf4ff", stroke: dim ? "#818b98" : "#0969da", "stroke-width": 1.5, opacity: dim ? 0.5 : 1 });
            e.draw("text", { x: 140 + i*150, y: UP_Y + 37, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: dim ? "#818b98" : "#0969da" }, "logits" + (i+1));
          }
          e.draw("text", { x: 380, y: UP_Y + 72, "text-anchor": "middle", "font-size": 11, fill: "#cf222e", "font-weight": 600 }, "边际化所有前驱 → 后段衰减(suffix decay)");
        }
      },
      { title: "Step 3: 串行段开始 — 采 E", desc: "用锚点 x0 查 W1[x0],加到 base_logits1,采样 E",
        render(e) {
          drawBase(e);
          // 锚点 x0
          e.draw("rect", { x: 30, y: DOWN_Y + 20, width: 36, height: 30, rx: 4, fill: "#fff8c5", stroke: "#9a6700" });
          e.draw("text", { x: 48, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#9a6700" }, "x0");
          // 箭头到 E
          e.draw("path", { d: "M 66 " + (DOWN_Y + 35) + " L 100 " + (DOWN_Y + 35), stroke: "#1a7f37", "stroke-width": 1.5, "marker-end": "url(#arrowhead)" });
          // E
          e.draw("rect", { x: 100, y: DOWN_Y + 20, width: 40, height: 30, rx: 4, fill: "#dafbe1", stroke: "#1a7f37" });
          e.draw("text", { x: 120, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#1a7f37" }, "E");
          e.draw("text", { x: 120, y: DOWN_Y + 62, "text-anchor": "middle", "font-size": 9, fill: "#1a7f37" }, "W1[x0]+base1");
        }
      },
      { title: "Step 4: E 的 markov embedding 飞向位置 2", desc: "前一步结果喂给下一步 — flyPacket 可视化依赖",
        render(e) {
          drawBase(e);
          e.draw("rect", { x: 30, y: DOWN_Y + 20, width: 36, height: 30, rx: 4, fill: "#fff8c5", stroke: "#9a6700" });
          e.draw("text", { x: 48, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#9a6700" }, "x0");
          e.draw("rect", { x: 100, y: DOWN_Y + 20, width: 40, height: 30, rx: 4, fill: "#dafbe1", stroke: "#1a7f37" });
          e.draw("text", { x: 120, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#1a7f37" }, "E");
          // 飞行包:E 的 markov embedding 飞向位置 2
          e.flyPacket("pkt-e", 140, DOWN_Y + 35, 250, DOWN_Y + 35, "W1[E]", "#ddf4ff", "#0969da");
          e.draw("rect", { x: 250, y: DOWN_Y + 20, width: 40, height: 30, rx: 4, fill: "#dafbe1", stroke: "#1a7f37" });
          e.draw("text", { x: 270, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#1a7f37" }, "F");
          e.draw("text", { x: 270, y: DOWN_Y + 62, "text-anchor": "middle", "font-size": 9, fill: "#1a7f37" }, "W1[E]+base2");
        }
      },
      { title: "Step 5: 串行继续 — G H 逐个,链式依赖", desc: "条件于实际前驱 → 无碰撞 → 后段不衰减",
        render(e) {
          drawBase(e);
          e.draw("rect", { x: 30, y: DOWN_Y + 20, width: 36, height: 30, rx: 4, fill: "#fff8c5", stroke: "#9a6700" });
          e.draw("text", { x: 48, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#9a6700" }, "x0");
          const toks = ["E","F","G","H"];
          toks.forEach(function (lbl, i) {
            const x = 100 + i*150;
            e.draw("rect", { x: x, y: DOWN_Y + 20, width: 40, height: 30, rx: 4, fill: "#dafbe1", stroke: "#1a7f37" });
            e.draw("text", { x: x + 20, y: DOWN_Y + 40, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#1a7f37" }, lbl);
            if (i < 3) e.draw("path", { d: "M " + (x + 40) + " " + (DOWN_Y + 35) + " L " + (x + 150) + " " + (DOWN_Y + 35), stroke: "#1a7f37", "stroke-width": 1.5, "marker-end": "url(#arrowhead)" });
          });
          e.draw("text", { x: 380, y: DOWN_Y + 75, "text-anchor": "middle", "font-size": 11, fill: "#1a7f37", "font-weight": 600 }, "条件于实际前驱 → 无碰撞 → 后段不衰减");
        }
      }
    ];
    return steps;
  }

  if (window.AnimEngine) {
    window.AnimEngine.register("two-stage-gen", svgFactory, buildSteps);
  }
})();
