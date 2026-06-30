/* 动画① 解码周期 — DSpark 一次完整解码流程 */
(function () {
  function svgFactory() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 720 360");
    // static layer (defs + 容器框,只在 step0 画一次)
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "g");
    bg.setAttribute("id", "static");
    // arrowhead marker 定义
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML =
      '<marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#818b98"/></marker>' +
      '<marker id="arrowhead-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#9a6700"/></marker>';
    svg.appendChild(defs);
    svg.appendChild(bg);
    // dynamic layer (动画元素)
    const dyn = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dyn.setAttribute("id", "dynamic");
    svg.appendChild(dyn);
    return svg;
  }

  function buildSteps() {
    // 三个容器坐标
    const C1 = { x: 20, y: 120, w: 180, h: 160, label: "① Target 一步" };
    const C2 = { x: 260, y: 80, w: 220, h: 240, label: "② Draft 生成" };
    const C3 = { x: 520, y: 120, w: 180, h: 160, label: "③ Target 验证" };

    function drawContainers(e) {
      e.clear();
      [C1, C2, C3].forEach(function (c, i) {
        e.draw("rect", { x: c.x, y: c.y, width: c.w, height: c.h, rx: 10,
          fill: "#f6f8fa", stroke: "#d0d7de", "stroke-width": 1.5, "stroke-dasharray": "5,3" });
        e.draw("text", { x: c.x + c.w / 2, y: c.y + 20, "text-anchor": "middle",
          "font-size": 13, "font-weight": 600, fill: "#57606a" }, c.label);
      });
      // 箭头: C1->C2, C2->C3
      e.draw("path", { d: "M " + (C1.x + C1.w) + " 200 L " + C2.x + " 200", stroke: "#818b98", "stroke-width": 1.5, fill: "none", "marker-end": "url(#arrowhead)" });
      e.draw("path", { d: "M " + (C2.x + C2.w) + " 200 L " + C3.x + " 200", stroke: "#818b98", "stroke-width": 1.5, fill: "none", "marker-end": "url(#arrowhead)" });
    }

    const steps = [
      { title: "初始: prompt ABC 进入 ①", desc: "target model 准备生成锚点 token D",
        render(e) {
          drawContainers(e);
          ["A","B","C"].forEach(function (lbl, i) {
            e.draw("rect", { x: C1.x + 30 + i*45, y: C1.y + 70, width: 36, height: 30, rx: 4, fill: "#ddf4ff", stroke: "#0969da" });
            e.draw("text", { x: C1.x + 48 + i*45, y: C1.y + 90, "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: "#0969da" }, lbl);
          });
        }
      },
      { title: "Step 1: target 前向 → 产出锚点 D", desc: "target 跑一次前向,生成 D 作为本轮锚点",
        render(e) {
          drawContainers(e);
          e.draw("rect", { x: C1.x, y: C1.y, width: C1.w, height: C1.h, rx: 10, fill: "#fff8c5", stroke: "#9a6700", "stroke-width": 2.5, class: "tween" });
          e.draw("text", { x: C1.x + C1.w/2, y: C1.y + 20, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#9a6700" }, "① Target 一步 [pulse]");
          e.draw("rect", { x: C1.x + 70, y: C1.y + 70, width: 40, height: 32, rx: 4, fill: "#fff8c5", stroke: "#9a6700", "stroke-width": 2 });
          e.draw("text", { x: C1.x + 90, y: C1.y + 91, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#9a6700" }, "D");
        }
      },
      { title: "Step 2: D 飞向 ② 作为草稿输入", desc: "锚点 D 传入并行 backbone",
        render(e) {
          drawContainers(e);
          e.flyPacket("pkt-d", C1.x + 90, C1.y + 86, C2.x + 40, C2.y + 120, "D", "#fff8c5", "#9a6700");
          e.draw("text", { x: C2.x + C2.w / 2, y: C2.y + 165, "text-anchor": "middle", "font-size": 11, fill: "#9a6700", "font-weight": 600 }, "D 作为 draft 输入");
        }
      },
      { title: "Step 3: 并行 backbone — 7 logits 同时产出", desc: "单次前向,所有位置同时亮起(并行!)",
        render(e) {
          drawContainers(e);
          e.draw("text", { x: C2.x + 10, y: C2.y + 155, "text-anchor": "middle", "font-size": 11, fill: "#57606a" }, "D");
          for (let i = 0; i < 6; i++) {
            e.draw("rect", { x: C2.x + 30 + i*30, y: C2.y + 145, width: 26, height: 22, rx: 3, fill: "#fbefff", stroke: "#8250df", "stroke-width": 1.5 });
            e.draw("text", { x: C2.x + 43 + i*30, y: C2.y + 160, "text-anchor": "middle", "font-size": 10, fill: "#8250df" }, "m");
          }
          // 7 logits 同时亮(同一帧)
          for (let i = 0; i < 7; i++) {
            e.draw("rect", { x: C2.x + 20 + i*28, y: C2.y + 185, width: 24, height: 20, rx: 3, fill: "#ddf4ff", stroke: "#0969da" });
            e.draw("text", { x: C2.x + 32 + i*28, y: C2.y + 199, "text-anchor": "middle", "font-size": 9, fill: "#0969da" }, "L"+(i+1));
          }
          e.draw("rect", { x: C2.x + 15, y: C2.y + 180, width: 200, height: 30, rx: 4, fill: "none", stroke: "#0969da", "stroke-dasharray": "3,2", opacity: 0.5 });
          e.draw("text", { x: C2.x + 115, y: C2.y + 225, "text-anchor": "middle", "font-size": 10, fill: "#0969da", "font-weight": 600 }, "1 forward pass → 同时");
        }
      },
      { title: "Step 4: 串行 head — E F G H 逐个采样", desc: "每个 token 依赖前一个(markov bias),逐个出现",
        render(e) {
          drawContainers(e);
          const toks = ["E","F","G","H"];
          const cs = ["0.95","0.88","0.72","0.45"];
          toks.forEach(function (lbl, i) {
            e.draw("rect", { x: C2.x + 30 + i*45, y: C2.y + 250, width: 36, height: 30, rx: 4, fill: "#dafbe1", stroke: "#1a7f37" });
            e.draw("text", { x: C2.x + 48 + i*45, y: C2.y + 270, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#1a7f37" }, lbl);
            e.draw("text", { x: C2.x + 48 + i*45, y: C2.y + 245, "text-anchor": "middle", "font-size": 9, fill: "#9a6700" }, "c"+(i+1)+"="+cs[i]);
            if (i < 3) e.draw("path", { d: "M " + (C2.x + 66 + i*45) + " " + (C2.y + 265) + " L " + (C2.x + 80 + i*45) + " " + (C2.y + 265), stroke: "#1a7f37", "stroke-width": 1.5, "marker-end": "url(#arrowhead)" });
          });
          e.draw("text", { x: C2.x + 115, y: C2.y + 310, "text-anchor": "middle", "font-size": 10, fill: "#1a7f37", "font-weight": 600 }, "逐个采样(串行)");
        }
      },
      { title: "Step 5: 调度器裁剪 — 保留 EFG, 丢弃 H", desc: "c4=0.45 低置信,H 被划掉",
        render(e) {
          drawContainers(e);
          ["E","F","G"].forEach(function (lbl, i) {
            e.draw("rect", { x: C2.x + 30 + i*45, y: C2.y + 250, width: 36, height: 30, rx: 4, fill: "#dafbe1", stroke: "#1a7f37" });
            e.draw("text", { x: C2.x + 48 + i*45, y: C2.y + 270, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#1a7f37" }, lbl);
          });
          // H 灰化+划掉
          e.draw("rect", { x: C2.x + 165, y: C2.y + 250, width: 36, height: 30, rx: 4, fill: "#f6f8fa", stroke: "#818b98", "stroke-dasharray": "3,2" });
          e.draw("text", { x: C2.x + 183, y: C2.y + 270, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#818b98" }, "H");
          e.draw("path", { d: "M " + (C2.x + 165) + " " + (C2.y + 250) + " L " + (C2.x + 201) + " " + (C2.y + 280), stroke: "#cf222e", "stroke-width": 2 });
          e.draw("text", { x: C2.x + 115, y: C2.y + 230, "text-anchor": "middle", "font-size": 10, fill: "#cf222e", "font-weight": 600 }, "c4 低 → 丢弃 H");
        }
      },
      { title: "Step 6: ③ target 验证 — E✓ F✓ G✗ 补 G'", desc: "target 并行验证 EFG,接受 EF,拒绝G,补 bonus G'",
        render(e) {
          drawContainers(e);
          e.draw("rect", { x: C3.x, y: C3.y, width: C3.w, height: C3.h, rx: 10, fill: "#fff8c5", stroke: "#9a6700", "stroke-width": 2.5, class: "tween" });
          ["E","F","G'"].forEach(function (lbl, i) {
            const isFix = lbl.indexOf("'") >= 0;
            e.draw("rect", { x: C3.x + 25 + i*45, y: C3.y + 70, width: 36, height: 30, rx: 4, fill: isFix ? "#fff1e6" : "#dafbe1", stroke: isFix ? "#bc4c00" : "#1a7f37" });
            e.draw("text", { x: C3.x + 43 + i*45, y: C3.y + 90, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: isFix ? "#bc4c00" : "#1a7f37" }, lbl);
            e.draw("text", { x: C3.x + 43 + i*45, y: C3.y + 115, "text-anchor": "middle", "font-size": 12, fill: "#1a7f37" }, isFix ? "✗→fix" : "✓");
          });
          e.draw("text", { x: C3.x + C3.w/2, y: C3.y + 140, "text-anchor": "middle", "font-size": 11, fill: "#57606a" }, "接受 EF, 拒绝G, 补G'");
        }
      },
      { title: "Step 7: next round — G' 成为下一轮锚点", desc: "循环回到 ①,以 G' 为新锚点继续",
        render(e) {
          drawContainers(e);
          e.flyPacket("pkt-gp", C3.x + 70, C3.y + 86, C1.x + 90, C1.y + 86, "G'", "#fff1e6", "#bc4c00");
          e.draw("path", { d: "M " + C3.x + " " + (C3.y - 10) + " Q " + ((C1.x+C3.x)/2) + " " + (C3.y - 60) + " " + (C1.x + C1.w) + " " + (C1.y - 10), stroke: "#8250df", "stroke-width": 1.5, fill: "none", "stroke-dasharray": "4,3", "marker-end": "url(#arrowhead)" });
          e.draw("text", { x: 360, y: 40, "text-anchor": "middle", "font-size": 12, fill: "#8250df", "font-weight": 600 }, "next round: 以 G' 为锚点");
        }
      }
    ];
    return steps;
  }

  if (window.AnimEngine) {
    window.AnimEngine.register("decode-cycle", svgFactory, buildSteps);
  }
})();
