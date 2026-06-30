/* 动画③ DSpark anchor position reuse — condition-only slot becomes useful logit */
(function () {
  function svgFactory() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 900 360");
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
    const rows = {
      old: { y: 92, label: "原版 DFlash", color: "#0969da", fill: "#ddf4ff" },
      neu: { y: 222, label: "DSpark 改造", color: "#1a7f37", fill: "#dafbe1" }
    };

    function text(e, x, y, value, fill, size, weight, anchor) {
      e.draw("text", {
        x: x, y: y, "text-anchor": anchor || "middle",
        "font-size": size || 12, "font-weight": weight || 600,
        fill: fill || "#1f2328"
      }, value);
    }

    function box(e, x, y, w, h, label, fill, stroke, size) {
      e.draw("rect", {
        x: x, y: y, width: w, height: h, rx: 6,
        fill: fill, stroke: stroke, "stroke-width": 1.5
      });
      text(e, x + w / 2, y + h / 2 + 4, label, stroke, size || 12, 750);
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

    function drawRowShell(e, rowKey) {
      const row = rows[rowKey];
      e.draw("rect", {
        x: 26, y: row.y - 38, width: 848, height: 104, rx: 9,
        fill: "#f6f8fa", stroke: "#d0d7de", "stroke-dasharray": "5,3"
      });
      text(e, 84, row.y - 12, row.label, row.color, 13, 800);
      text(e, 255, row.y - 12, "input slots", "#57606a", 11, 700);
      text(e, 618, row.y - 12, "useful logits", "#57606a", 11, 700);
    }

    function drawSlots(e, rowKey, mode) {
      const row = rows[rowKey];
      const y = row.y + 12;
      const labels = ["D", "M1", "M2", "M3"];
      labels.forEach(function (label, i) {
        const isAnchor = i === 0;
        const fill = isAnchor ? "#fff8c5" : row.fill;
        const stroke = isAnchor ? "#9a6700" : row.color;
        box(e, 155 + i * 62, y, 42, 34, label, fill, stroke, 12);
      });
      arrow(e, 420, y + 17, 500, y + 17, "#818b98");
      box(e, 500, y - 8, 70, 50, "backbone", "#ffffff", "#818b98", 10);

      const outputLabels = mode === "old" ? ["-", "L1", "L2", "L3"] : ["L0", "L1", "L2", "L3"];
      outputLabels.forEach(function (label, i) {
        const disabled = label === "-";
        const fill = disabled ? "#f6f8fa" : row.fill;
        const stroke = disabled ? "#818b98" : row.color;
        const opacity = disabled ? 0.55 : 1;
        e.draw("rect", {
          x: 610 + i * 48, y: y, width: 36, height: 34, rx: 6,
          fill: fill, stroke: stroke, "stroke-width": 1.5, opacity: opacity
        });
        text(e, 628 + i * 48, y + 22, label, stroke, 12, 800);
      });
    }

    function drawWasteMark(e) {
      const y = rows.old.y + 24;
      e.draw("path", {
        d: "M 152 " + (y - 19) + " L 200 " + (y + 23),
        stroke: "#cf222e", "stroke-width": 2.4
      });
      e.draw("path", {
        d: "M 200 " + (y - 19) + " L 152 " + (y + 23),
        stroke: "#cf222e", "stroke-width": 2.4
      });
      text(e, 224, y + 7, "condition only", "#cf222e", 11, 750, "start");
      text(e, 628, y + 54, "0 output at anchor slot", "#cf222e", 11, 750);
    }

    function drawGainMark(e) {
      const y = rows.neu.y + 24;
      e.draw("rect", {
        x: 604, y: y - 24, width: 48, height: 46, rx: 8,
        fill: "none", stroke: "#1a7f37", "stroke-width": 2.2
      });
      text(e, 628, y + 54, "+1 useful logit", "#1a7f37", 12, 800);
      text(e, 404, 342, "同样 4 个前向槽位: 原版 3 个有效输出, DSpark 4 个有效输出", "#1a7f37", 13, 800);
    }

    return [
      {
        title: "Step 0: 固定前向槽位",
        desc: "先假设一次 draft backbone 有 4 个可用输入槽位",
        render(e) {
          frame(e, "Anchor slot reuse: condition-only -> useful prediction", "比较同样前向槽位下,锚点 D 是否也产出 logit");
          drawRowShell(e, "old");
          drawRowShell(e, "neu");
        }
      },
      {
        title: "Step 1: 原版 DFlash",
        desc: "锚点 D 只提供条件,不在自己的位置产出预测",
        render(e) {
          frame(e, "原版 DFlash: anchor is clean condition", "D 是 target/已验证前缀给出的干净 token,只帮 mask 位置预测");
          drawRowShell(e, "old");
          drawSlots(e, "old", "old");
          drawWasteMark(e);
        }
      },
      {
        title: "Step 2: DSpark 改造",
        desc: "锚点位置也变成预测位置,第一个 logit 不再浪费",
        render(e) {
          frame(e, "DSpark: anchor slot also predicts", "把锚点本身也当作 block 的第一个预测位置");
          drawRowShell(e, "neu");
          drawSlots(e, "neu", "new");
          drawGainMark(e);
        }
      },
      {
        title: "Step 3: 同屏对比",
        desc: "同样 backbone 前向,DSpark 多一个有效输出",
        render(e) {
          frame(e, "同样前向,更多有效产出", "原版把一个位置花在条件上; DSpark 把条件位置复用为预测位置");
          drawRowShell(e, "old");
          drawSlots(e, "old", "old");
          drawWasteMark(e);
          drawRowShell(e, "neu");
          drawSlots(e, "neu", "new");
          drawGainMark(e);
        }
      },
      {
        title: "Step 4: 换成 γ 的说法",
        desc: "原版需要 anchor + γ masks; DSpark 用 anchor + γ-1 masks 就得到 γ logits",
        render(e) {
          frame(e, "把节省量写成 block_size γ", "目标不是改变 backbone,而是让每个前向槽位都产出有用预测");
          text(e, 450, 112, "原版 DFlash: D(condition) + γ masks -> γ logits", "#0969da", 16, 800);
          text(e, 450, 178, "DSpark: D(logit 0) + (γ - 1) masks -> γ logits", "#1a7f37", 16, 800);
          box(e, 330, 232, 240, 48, "same γ logits, fewer slots", "#dafbe1", "#1a7f37", 14);
          text(e, 450, 316, "单位起草算力产出更高,所以 §4.3.2 延迟几乎零开销", "#57606a", 13, 700);
        }
      }
    ];
  }

  if (window.AnimEngine) {
    window.AnimEngine.register("dspark-anchor-logit", svgFactory, buildSteps);
  }
})();
