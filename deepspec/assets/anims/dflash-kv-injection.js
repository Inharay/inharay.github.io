/* 动画② DFlash KV injection — target hidden states become draft K/V context */
(function () {
  function svgFactory() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 900 420");
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
    function text(e, x, y, value, fill, size, weight, anchor) {
      e.draw("text", {
        x: x, y: y, "text-anchor": anchor || "middle",
        "font-size": size || 12, "font-weight": weight || 600,
        fill: fill || "#1f2328"
      }, value);
    }

    function box(e, x, y, w, h, label, fill, stroke, size) {
      e.draw("rect", {
        x: x, y: y, width: w, height: h, rx: 7,
        fill: fill, stroke: stroke, "stroke-width": 1.5
      });
      text(e, x + w / 2, y + h / 2 + 4, label, stroke, size || 12, 700);
    }

    function arrow(e, x1, y1, x2, y2, color, dashed) {
      const attrs = {
        d: "M " + x1 + " " + y1 + " L " + x2 + " " + y2,
        stroke: color || "#818b98", "stroke-width": 1.8,
        fill: "none", "marker-end": "url(#arrowhead)"
      };
      if (dashed) attrs["stroke-dasharray"] = "5,3";
      e.draw("path", attrs);
    }

    function frame(e, title, subtitle) {
      e.clear();
      text(e, 450, 28, title, "#1f2328", 17, 750);
      if (subtitle) text(e, 450, 50, subtitle, "#57606a", 11, 500);
    }

    function drawTarget(e, activeLayers) {
      box(e, 40, 92, 150, 250, "target model", "#f6f8fa", "#57606a", 13);
      const layers = [
        { name: "layer 1", y: 120 },
        { name: "layer 9", y: 165 },
        { name: "layer 17", y: 210 },
        { name: "layer 25", y: 255 },
        { name: "layer 33", y: 300 }
      ];
      layers.forEach(function (layer, i) {
        const hot = activeLayers;
        box(e, 72, layer.y, 86, 28, layer.name, hot ? "#ddf4ff" : "#ffffff", hot ? "#0969da" : "#d0d7de", 10);
        if (hot) text(e, 174, layer.y + 19, "h" + (i + 1), "#0969da", 10, 700, "start");
      });
    }

    function drawProjector(e, active) {
      box(e, 290, 132, 110, 170, "concat", active ? "#fff8c5" : "#f6f8fa", active ? "#9a6700" : "#d0d7de");
      text(e, 345, 324, "[h1; h9; ...]", "#9a6700", 11, 650);
      box(e, 465, 152, 130, 130, "fc + RMSNorm", active ? "#fbefff" : "#f6f8fa", active ? "#8250df" : "#d0d7de", 12);
      text(e, 530, 306, "h_ctx", active ? "#8250df" : "#57606a", 13, 800);
    }

    function drawDraft(e, injected) {
      box(e, 675, 92, 170, 250, "draft attention", "#f6f8fa", "#57606a", 13);
      ["D", "M1", "M2", "M3"].forEach(function (label, i) {
        box(e, 700 + i * 34, 126, 28, 28, label, "#dafbe1", "#1a7f37", 10);
      });
      text(e, 758, 178, "Q from draft slots", "#1a7f37", 11, 700);

      const fill = injected ? "#ddf4ff" : "#ffffff";
      const stroke = injected ? "#0969da" : "#d0d7de";
      box(e, 700, 212, 55, 34, "K_ctx", fill, stroke, 10);
      box(e, 760, 212, 55, 34, "V_ctx", fill, stroke, 10);
      box(e, 700, 262, 55, 34, "K_draft", "#ffffff", "#d0d7de", 9);
      box(e, 760, 262, 55, 34, "V_draft", "#ffffff", "#d0d7de", 9);
      if (injected) {
        e.draw("rect", { x: 692, y: 204, width: 132, height: 48, rx: 8, fill: "none", stroke: "#0969da", "stroke-width": 2, "stroke-dasharray": "4,2" });
        text(e, 758, 326, "target context is injected into every layer", "#0969da", 10, 700);
      }
    }

    function drawLogits(e) {
      ["L1", "L2", "L3", "L4"].forEach(function (label, i) {
        box(e, 682 + i * 42, 360, 32, 26, label, "#ddf4ff", "#0969da", 10);
      });
      text(e, 760, 404, "one forward -> block logits", "#0969da", 11, 750);
    }

    return [
      {
        title: "Step 0: target 先读前缀",
        desc: "强 target model 产生多层 hidden states",
        render(e) {
          frame(e, "DFlash KV injection: target hidden becomes draft context", "先让 target 跑过已接受前缀,留下多层语义特征");
          drawTarget(e, true);
          drawProjector(e, false);
          drawDraft(e, false);
        }
      },
      {
        title: "Step 1: 抽取 target_layer_ids",
        desc: "从多层 target hidden 抽样,而不是只拿最后一层",
        render(e) {
          frame(e, "抽取多层 target hidden states", "源码里由 target_layer_ids 控制,例如 [1, 9, 17, 25, 33]");
          drawTarget(e, true);
          drawProjector(e, true);
          drawDraft(e, false);
          [134, 179, 224, 269, 314].forEach(function (y) {
            arrow(e, 190, y, 290, 205, "#0969da", true);
          });
        }
      },
      {
        title: "Step 2: 拼接并投影成 h_ctx",
        desc: "concat 后用 fc 压回 draft hidden size,再 RMSNorm",
        render(e) {
          frame(e, "concat -> fc -> RMSNorm", "把 L 层 target 特征压成 draft 可消费的 h_ctx");
          drawTarget(e, true);
          drawProjector(e, true);
          drawDraft(e, false);
          arrow(e, 400, 217, 465, 217, "#9a6700");
          e.flyPacket("ctx", 392, 196, 462, 196, "ctx", "#fff8c5", "#9a6700");
        }
      },
      {
        title: "Step 3: 注入每层 draft K/V",
        desc: "k_ctx/v_ctx 与 draft 自身 k_noise/v_noise 在序列维拼接",
        render(e) {
          frame(e, "KV injection happens inside attention", "K=[K_ctx; K_draft], V=[V_ctx; V_draft]");
          drawTarget(e, true);
          drawProjector(e, true);
          drawDraft(e, true);
          arrow(e, 595, 217, 700, 230, "#8250df");
          e.flyPacket("hctx", 590, 196, 690, 218, "h_ctx", "#fbefff", "#8250df");
        }
      },
      {
        title: "Step 4: draft query 读取 target 上下文",
        desc: "每个 mask/anchor 位置都能 attend 到注入的 target K/V",
        render(e) {
          frame(e, "parallel slots attend to injected K/V", "draft 仍然并行,但每个位置都读到 target 的多层上下文");
          drawTarget(e, true);
          drawProjector(e, true);
          drawDraft(e, true);
          [714, 748, 782, 816].forEach(function (x) {
            arrow(e, x, 158, 758, 212, "#1a7f37", true);
          });
        }
      },
      {
        title: "Step 5: 一次前向产出整块 logits",
        desc: "并行速度保留,预测质量来自 target context 注入",
        render(e) {
          frame(e, "one draft forward, block logits", "DFlash 的深并行 backbone 正是 DSpark 并行段的基础");
          drawTarget(e, true);
          drawProjector(e, true);
          drawDraft(e, true);
          arrow(e, 760, 342, 760, 360, "#0969da");
          drawLogits(e);
        }
      }
    ];
  }

  if (window.AnimEngine) {
    window.AnimEngine.register("dflash-kv-injection", svgFactory, buildSteps);
  }
})();
