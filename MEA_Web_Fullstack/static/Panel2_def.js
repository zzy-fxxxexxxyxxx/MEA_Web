import { inpaint_nans } from "./inpaint_nans.js";

/**
 * 根据 colorPickValue 返回自定义颜色数组
 * @param {string} colorPickValue - "color1" ~ "color6"
 * @returns {Array<Array<number>>} customColors - RGB 数组，每个元素为 [r, g, b]
 */
function ChooseColor(colorPickValue) {
  let customColors = [];

  switch (colorPickValue) {
    case "color1":
      customColors = [
        [0 / 255, 123 / 255, 154 / 255],
        [0 / 255, 168 / 255, 204 / 255],
        [102 / 255, 203 / 255, 233 / 255],
        [132 / 255, 211 / 255, 234 / 255],
        [169 / 255, 222 / 255, 236 / 255],
        [209 / 255, 236 / 255, 243 / 255],
        [250 / 255, 254 / 255, 255 / 255],
        [253 / 255, 228 / 255, 200 / 255],
        [253 / 255, 201 / 255, 153 / 255],
        [250 / 255, 171 / 255, 104 / 255],
        [246 / 255, 141 / 255, 55 / 255],
        [202 / 255, 90 / 255, 40 / 255],
        [152 / 255, 66 / 255, 33 / 255],
      ];
      break;

    case "color2":
      customColors = [
        [0.5333, 0.6353, 0.7804],
        [0.4667, 0.6941, 0.8745],
        [0.5843, 0.7961, 0.3843],
        [0.9647, 0.7098, 0.1608],
        [0.9804, 0.8627, 0.4941],
      ];
      break;

    case "color3":
      customColors = [
        [0.6471, 0, 0.149],
        [0.7503, 0.0991, 0.1511],
        [0.8491, 0.2008, 0.1587],
        [0.909, 0.3267, 0.2165],
        [0.9606, 0.4543, 0.2751],
        [0.9792, 0.5884, 0.337],
        [0.9928, 0.7133, 0.4095],
        [0.9948, 0.8165, 0.5065],
        [0.9969, 0.904, 0.6035],
        [0.999, 0.968, 0.7005],
        [0.968, 0.9876, 0.8078],
        [0.904, 0.9628, 0.9255],
        [0.8128, 0.9207, 0.954],
        [0.7034, 0.8671, 0.923],
        [0.5911, 0.7874, 0.8791],
        [0.4776, 0.6966, 0.8295],
        [0.3773, 0.586, 0.7717],
        [0.2803, 0.4704, 0.7119],
        [0.2334, 0.3418, 0.6483],
        [0.1922, 0.2118, 0.5843],
      ];
      break;

    case "color4":
      customColors = [
        [0.3608, 0.0941, 0.4667],
        [0.6667, 0.1333, 0.4745],
        [1.0, 0.6667, 0.4627],
        [0.9961, 0.9255, 0.6863],
        [1.0, 0.8275, 0.7137],
      ];
      break;

    case "color5":
      customColors = [
        [0.4745, 0.651, 0.8078],
        [0.6824, 0.8235, 0.898],
        [0.9412, 0.9725, 0.8627],
        [0.9922, 0.9686, 0.7059],
        [1, 0.902, 0.6039],
      ];
      break;

    case "color6":
      customColors = [
        [0.4196, 0.5843, 0.7725],
        [0.6471, 0.8706, 0.9451],
        [0.6745, 0.8431, 0.6588],
        [0.9804, 0.6784, 0.451],
        [0.9804, 0.898, 0.5686],
      ];
      break;

    default:
      console.warn("未知 colorPickValue: " + colorPickValue);
      break;
  }

  return customColors;
}

/**
 * 处理某一时刻 (t0) 的峰到达时间数据，并生成插值后的矩阵
 *
 * @param {number[]} t0Row - `processedData.peakArriveTime[t0]`，长度 = 通道数
 * @param {number} fs - 采样频率 (Hz)
 * @param {number[]} layout - 通道布局数组，例如 [11, 21, 31, ...]
 * @returns {{ showBuffer: number[], processData: number[][] }}
 *          showBuffer: 归一化后的 t0 行数据 (ms)
 *          processData: 插值后的 9x9 矩阵
 */
export async function HeatCalculate(t0Row, fs, layout) {
  const xRange = 8;
  const yRange = 8;

  // === Step 1: 转换成 ms ===
  let showBuffer = t0Row.map((v) => (v / fs) * 1e3);

  //console.log({ showBuffer }); //正确

  // === Step 2: 减去最小值，保证从 0 开始 ===
  const minVal = Math.min(...showBuffer.filter((v) => !isNaN(v)));
  showBuffer = showBuffer.map((v) => v - minVal);

  //console.log({ showBuffer }); //正确

  // === Step 3: 初始化 8x8 矩阵 ===
  let peakArriveTimeHeatmap = Array.from({ length: xRange }, () =>
    Array(yRange).fill(NaN)
  );

  // === Step 4: 填充有效点 ===
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i === 0 || i === 7) && (j === 0 || j === 7)) continue;
      if (i === 4 && j === 0) continue;

      const layoutVal = (j + 1) * 10 + (i + 1);
      const idx = layout.findIndex((v) => v === layoutVal);
      if (idx >= 0) {
        peakArriveTimeHeatmap[i][j] = showBuffer[idx];
      }
    }
  }

  //console.log({ peakArriveTimeHeatmap }); //正确

  // === Step 5: flipud ===
  let B = peakArriveTimeHeatmap.slice().reverse();

  //console.log({ B }); //正确

  // === Step 6: 添加一行一列 NaN ===
  let row = Array(8).fill(NaN);
  B.push(row);
  let processData = B.map((r) => [...r, NaN]);

  console.log({ processData }); //正确

  // === Step 7: 插值 ===
  processData = inpaint_nans(processData);

  // === Step 8: 四个角设 NaN ===
  processData[0][0] = NaN;
  processData[0][8] = NaN;
  processData[8][0] = NaN;
  processData[8][8] = NaN;

  console.log({ processData }); //正确

  return processData;
}

//--------------------- 在 panel2 绘制电极阵列 + 轴对齐的四角凹陷边框 ------------------------

export function drawGridOnPanel2() {
  const svg = document.getElementById("panel2SVG");
  if (!svg) return;

  // 获取 layoutLayer 图层，如果没有则创建
  let layoutLayer = svg.querySelector("#layoutLayer");
  if (!layoutLayer) {
    layoutLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layoutLayer.setAttribute("id", "layoutLayer");
    svg.appendChild(layoutLayer);
  }

  // 清空 layoutLayer（不会影响热力图和箭头层）
  layoutLayer.innerHTML = "";

  const rows = 8;
  const cols = 8;
  const gridGap = 0; // 电极紧贴排列
  const notchDepthCells = 1;

  const rect = svg.parentElement.getBoundingClientRect();
  if (!rect) return;
  svg.style.width = rect.width * 0.9 + "px";
  svg.style.height = rect.height * 0.9 + "px";

  const width = rect.width * 0.9;
  const height = rect.height * 0.9;

  const cellWidth = (width - (cols - 1) * gridGap) / cols;
  const cellHeight = (height - (rows - 1) * gridGap) / rows;

  // ---------- 1) 绘制圆形电极 ----------
  const radius = Math.min(cellWidth, cellHeight) * 0.06;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (
        (r === 0 && c === 0) ||
        (r === 0 && c === cols - 1) ||
        (r === rows - 1 && c === 0) ||
        (r === rows - 1 && c === cols - 1)
      )
        continue;

      const cx = c * (cellWidth + gridGap) + cellWidth / 2;
      const cy = r * (cellHeight + gridGap) + cellHeight / 2;

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", radius);
      circle.setAttribute("stroke", "black");
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke-width", 1);
      layoutLayer.appendChild(circle);
    }
  }

  // ---------- 2) 绘制缺角矩形外框 ----------
  const L = 1,
    T = 1,
    R = width - 1,
    B = height - 2;
  const nx = notchDepthCells * cellWidth;
  const ny = notchDepthCells * cellHeight;

  const pts = [
    [L + nx, T],
    [R - nx, T],
    [R - nx, T + ny],
    [R, T + ny],
    [R, B - ny],
    [R - nx, B - ny],
    [R - nx, B],
    [L + nx, B],
    [L + nx, B - ny],
    [L, B - ny],
    [L, T + ny],
    [L + nx, T + ny],
  ];

  const polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  polygon.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
  polygon.setAttribute("stroke", "black");
  polygon.setAttribute("fill", "none");
  polygon.setAttribute("stroke-width", 1);
  layoutLayer.appendChild(polygon);
}

export async function drawSmoothHeatmapTransparentCorners(
  data,
  colorPickValue = "color1"
) {
  const svg = document.getElementById("panel2SVG");
  if (!svg) return;

  // 获取或创建 heatmapLayer <g>
  let heatmapLayer = svg.querySelector("#heatmapLayer");
  if (!heatmapLayer) {
    heatmapLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    heatmapLayer.setAttribute("id", "heatmapLayer");
    svg.insertBefore(heatmapLayer, svg.firstElementChild); // 保证最底层
  }

  // 清空 heatmapLayer 内部的旧 image
  while (heatmapLayer.firstChild)
    heatmapLayer.removeChild(heatmapLayer.firstChild);
  // 清空箭头层
  let arrowsLayer = svg.querySelector("#arrowsLayer");
  if (arrowsLayer) {
    while (arrowsLayer.firstChild)
      arrowsLayer.removeChild(arrowsLayer.firstChild);
  }

  // 目标显示大小（CSS 像素）
  // const cssWidth = Math.round(rect.width * 0.9) - 1;
  // const cssHeight = Math.round(rect.height * 0.9) - 3;
  const cssWidth = svg.clientWidth - 1;
  const cssHeight = svg.clientHeight - 3;

  // 临时 canvas 使用 devicePixelRatio 提升分辨率
  const dpi = window.devicePixelRatio || 1;
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = Math.round(cssWidth * dpi);
  tmpCanvas.height = Math.round(cssHeight * dpi);
  const ctx = tmpCanvas.getContext("2d");

  const rows = data.length;
  const cols = data[0].length;
  const customColors = ChooseColor(colorPickValue);

  // 四角 mask 不绘制
  const mask = Array.from({ length: rows }, () => Array(cols).fill(true));
  mask[0][0] =
    mask[0][cols - 1] =
    mask[rows - 1][0] =
    mask[rows - 1][cols - 1] =
      false;

  // 找到数据范围
  let minVal = Infinity,
    maxVal = -Infinity;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v = data[i][j];
      if (!isNaN(v)) {
        minVal = Math.min(minVal, v);
        maxVal = Math.max(maxVal, v);
      }
    }
  }

  function valueToColor(val) {
    if (isNaN(val)) return [0, 0, 0, 0];
    const t = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
    const scaled = t * (customColors.length - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    const aIdx = Math.max(0, Math.min(customColors.length - 1, idx));
    const bIdx = Math.max(0, Math.min(customColors.length - 1, idx + 1));
    const [r1, g1, b1] = customColors[aIdx];
    const [r2, g2, b2] = customColors[bIdx];
    const r = Math.round((r1 + (r2 - r1) * frac) * 255);
    const g = Math.round((g1 + (g2 - g1) * frac) * 255);
    const b = Math.round((b1 + (b2 - b1) * frac) * 255);
    return [r, g, b, 255];
  }

  // 像素级双线性插值 + mask
  const W = tmpCanvas.width;
  const H = tmpCanvas.height;
  const imgData = ctx.createImageData(W, H);

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const x = (px / W) * (cols - 1);
      const y = (py / H) * (rows - 1);
      const x0 = Math.floor(x),
        x1 = Math.min(x0 + 1, cols - 1);
      const y0 = Math.floor(y),
        y1 = Math.min(y0 + 1, rows - 1);
      const outIdx = (py * W + px) * 4;

      if (mask[y0][x0] && mask[y0][x1] && mask[y1][x0] && mask[y1][x1]) {
        const v00 = data[y0][x0],
          v01 = data[y0][x1],
          v10 = data[y1][x0],
          v11 = data[y1][x1];
        const valid = [
          isNaN(v00) ? 0 : v00,
          isNaN(v01) ? 0 : v01,
          isNaN(v10) ? 0 : v10,
          isNaN(v11) ? 0 : v11,
        ];
        const weight = [
          isNaN(v00) ? 0 : 1,
          isNaN(v01) ? 0 : 1,
          isNaN(v10) ? 0 : 1,
          isNaN(v11) ? 0 : 1,
        ];
        const wx0 = 1 - (x - x0),
          wx1 = x - x0;
        const wy0 = 1 - (y - y0),
          wy1 = y - y0;
        const sumWeight =
          weight[0] * wx0 * wy0 +
          weight[1] * wx1 * wy0 +
          weight[2] * wx0 * wy1 +
          weight[3] * wx1 * wy1;

        let val = NaN;
        if (sumWeight > 0) {
          val =
            (valid[0] * wx0 * wy0 +
              valid[1] * wx1 * wy0 +
              valid[2] * wx0 * wy1 +
              valid[3] * wx1 * wy1) /
            sumWeight;
        }

        const [r, g, b, a] = valueToColor(val);
        imgData.data[outIdx] = r;
        imgData.data[outIdx + 1] = g;
        imgData.data[outIdx + 2] = b;
        imgData.data[outIdx + 3] = a;
      } else {
        imgData.data[outIdx] = 0;
        imgData.data[outIdx + 1] = 0;
        imgData.data[outIdx + 2] = 0;
        imgData.data[outIdx + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 转 dataURL 并插入 heatmapLayer
  const dataURL = tmpCanvas.toDataURL();
  const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
  img.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataURL);
  img.setAttribute("href", dataURL);
  img.setAttribute("x", 0);
  img.setAttribute("y", 1);
  img.setAttribute("width", cssWidth);
  img.setAttribute("height", cssHeight);
  img.setAttribute("preserveAspectRatio", "none");
  heatmapLayer.appendChild(img);
}

export function drawArrow(matrix, Factor) {
  const svg = document.getElementById("panel2SVG");
  if (!svg) return;

  // 获取或创建 arrowsLayer
  let arrowsLayer = svg.querySelector("#arrowsLayer");
  if (!arrowsLayer) {
    arrowsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    arrowsLayer.setAttribute("id", "arrowsLayer");
    svg.appendChild(arrowsLayer); // 保证在最上层
  }

  // 清空上一次的箭头
  while (arrowsLayer.firstChild)
    arrowsLayer.removeChild(arrowsLayer.firstChild);

  // -----------------------------
  // 1️⃣ 插值函数
  // -----------------------------
  function interp2_linear(mat, factor) {
    const rows = mat.length;
    const cols = mat[0].length;

    const rowInterp = [];
    for (let i = 0; i < rows; i++) {
      const row = mat[i];
      const newRow = [];
      for (let j = 0; j < cols - 1; j++) {
        const a = row[j];
        const b = row[j + 1];
        newRow.push(a);
        for (let k = 1; k < factor; k++) {
          newRow.push(
            isNaN(a) || isNaN(b) ? NaN : a * (1 - k / factor) + b * (k / factor)
          );
        }
      }
      newRow.push(row[cols - 1]);
      rowInterp.push(newRow);
    }

    const newRows = (rows - 1) * factor + 1;
    const newCols = rowInterp[0].length;
    const result = Array.from({ length: newRows }, () =>
      Array(newCols).fill(0)
    );

    for (let j = 0; j < newCols; j++) {
      for (let i = 0; i < rows - 1; i++) {
        const a = rowInterp[i][j];
        const b = rowInterp[i + 1][j];
        result[i * factor][j] = a;
        for (let k = 1; k < factor; k++) {
          result[i * factor + k][j] =
            isNaN(a) || isNaN(b)
              ? NaN
              : a * (1 - k / factor) + b * (k / factor);
        }
      }
      result[newRows - 1][j] = rowInterp[rows - 1][j];
    }
    return result;
  }

  const Vq = interp2_linear(matrix, Factor);

  // -----------------------------
  // 2️⃣ 计算梯度
  // -----------------------------
  function gradient(mat, step = 0.5) {
    const n = mat.length;
    const m = mat[0].length;
    const DX = [],
      DY = [];
    for (let i = 0; i < n; i++) {
      DX[i] = [];
      DY[i] = [];
      for (let j = 0; j < m; j++) {
        if (isNaN(mat[i][j])) {
          DX[i][j] = DY[i][j] = NaN;
          continue;
        }
        DX[i][j] =
          (j === 0
            ? mat[i][j + 1] - mat[i][j]
            : j === m - 1
            ? mat[i][j] - mat[i][j - 1]
            : (mat[i][j + 1] - mat[i][j - 1]) / 2) / step;
        DY[i][j] =
          (i === 0
            ? mat[i + 1][j] - mat[i][j]
            : i === n - 1
            ? mat[i][j] - mat[i - 1][j]
            : (mat[i + 1][j] - mat[i - 1][j]) / 2) / step;
      }
    }
    return { DX, DY };
  }

  let { DX, DY } = gradient(Vq, 1 / Factor);

  // -----------------------------
  // 3️⃣ 去掉边缘
  // -----------------------------
  DX = DX.slice(1, -1).map((row) => row.slice(1, -1));
  DY = DY.slice(1, -1).map((row) => row.slice(1, -1));

  const rows = DX.length;
  const cols = DX[0].length;

  // -----------------------------
  // 4️⃣ 自动缩放箭头长度
  // -----------------------------
  let minLen = Infinity,
    maxLen = -Infinity;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (isNaN(DX[i][j]) || isNaN(DY[i][j])) continue;
      const len = Math.sqrt(DX[i][j] ** 2 + DY[i][j] ** 2);
      minLen = Math.min(minLen, len);
      maxLen = Math.max(maxLen, len);
    }
  }

  const maxArrowPixels = 25;
  const minArrowPixels = 15;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (isNaN(DX[i][j]) || isNaN(DY[i][j])) continue;
      const len = Math.sqrt(DX[i][j] ** 2 + DY[i][j] ** 2);
      let scale =
        maxLen === minLen
          ? (maxArrowPixels + minArrowPixels) / 2 / len
          : (minArrowPixels +
              ((len - minLen) / (maxLen - minLen)) *
                (maxArrowPixels - minArrowPixels)) /
            len;
      DX[i][j] *= scale;
      DY[i][j] *= scale;
    }
  }

  // -----------------------------
  // 5️⃣ 绘制箭头函数（添加到 arrowsLayer）
  // -----------------------------
  function drawArrowLine(x1, y1, x2, y2, color = "#808080") {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", 1.5);
    arrowsLayer.appendChild(line);

    const dx = x2 - x1,
      dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(10, len * 0.2);
    const arrowAngle = Math.PI / 6;

    const points = [
      [x2 + headLen * Math.cos(angle), y2 + headLen * Math.sin(angle)],
      [
        x2 - headLen * Math.cos(angle - arrowAngle),
        y2 - headLen * Math.sin(angle - arrowAngle),
      ],
      [
        x2 - headLen * Math.cos(angle + arrowAngle),
        y2 - headLen * Math.sin(angle + arrowAngle),
      ],
    ]
      .map((p) => p.join(","))
      .join(" ");

    const tri = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    tri.setAttribute("points", points);
    tri.setAttribute("fill", color);
    arrowsLayer.appendChild(tri);
  }

  // -----------------------------
  // 6️⃣ 映射网格到 SVG 并绘制箭头
  // -----------------------------
  const width = svg.clientWidth;
  const height = svg.clientHeight;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (isNaN(DX[i][j]) || isNaN(DY[i][j])) continue;
      const x = width / (cols + 1) + j * (width / (cols + 1));
      const y = height / (cols + 1) + i * (height / (cols + 1));
      drawArrowLine(x, y, x + DX[i][j], y + DY[i][j]);
    }
  }
}

// ----------------画热力图 Canvas版本------------------------------------

// export function drawSmoothHeatmapTransparentCorners(
//   data,
//   colorPickValue = "color1"
// ) {
//   const canvas = document.getElementById("panel2Canvas");
//   if (!canvas) return;
//   const ctx = canvas.getContext("2d");
//   const panel = document.getElementById("panel2");
//   if (!panel) return;

//   const rows = 9;
//   const cols = 9;

//   const dpi = window.devicePixelRatio || 1;
//   const cssWidth = panel.clientWidth * 0.9;
//   const cssHeight = panel.clientHeight * 0.9;
//   canvas.style.width = cssWidth + "px";
//   canvas.style.height = cssHeight + "px";
//   canvas.width = Math.round(cssWidth * dpi);
//   canvas.height = Math.round(cssHeight * dpi);
//   ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
//   ctx.clearRect(0, 0, cssWidth, cssHeight);

//   const customColors = ChooseColor(colorPickValue);

//   let minVal = Infinity,
//     maxVal = -Infinity;
//   for (let i = 0; i < rows; i++)
//     for (let j = 0; j < cols; j++)
//       if (!isNaN(data[i][j])) {
//         minVal = Math.min(minVal, data[i][j]);
//         maxVal = Math.max(maxVal, data[i][j]);
//       }

//   // 掩码矩阵：true=绘制，false=透明
//   const mask = Array.from({ length: rows }, () => Array(cols).fill(true));
//   mask[0][0] =
//     mask[0][cols - 1] =
//     mask[rows - 1][0] =
//     mask[rows - 1][cols - 1] =
//       false;

//   //颜色无极变换的实现
//   function valueToColor(val) {
//     if (isNaN(val)) return [0, 0, 0, 0];
//     const t = (val - minVal) / (maxVal - minVal);
//     const scaled = t * (customColors.length - 1);
//     const idx = Math.floor(scaled);
//     const frac = scaled - idx; // 小数部分

//     const [r1, g1, b1] = customColors[idx];
//     const [r2, g2, b2] =
//       customColors[Math.min(idx + 1, customColors.length - 1)];

//     const r = r1 + (r2 - r1) * frac;
//     const g = g1 + (g2 - g1) * frac;
//     const b = b1 + (b2 - b1) * frac;

//     return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
//   }

//   const imgData = ctx.createImageData(canvas.width, canvas.height);
//   for (let py = 0; py < canvas.height; py++) {
//     for (let px = 0; px < canvas.width; px++) {
//       const x = (px / canvas.width) * (cols - 1);
//       const y = (py / canvas.height) * (rows - 1);

//       const x0 = Math.floor(x),
//         x1 = Math.min(x0 + 1, cols - 1);
//       const y0 = Math.floor(y),
//         y1 = Math.min(y0 + 1, rows - 1);

//       // 四角透明判断
//       let [r, g, b, a] = [0, 0, 0, 0]; // 默认透明
//       if (mask[y0][x0] && mask[y0][x1] && mask[y1][x0] && mask[y1][x1]) {
//         const v = [data[y0][x0], data[y0][x1], data[y1][x0], data[y1][x1]];
//         const valid = v.map((vv) => (isNaN(vv) ? 0 : vv));
//         const weight = v.map((vv) => (isNaN(vv) ? 0 : 1));

//         const wx0 = 1 - (x - x0),
//           wx1 = x - x0;
//         const wy0 = 1 - (y - y0),
//           wy1 = y - y0;

//         const sumWeight =
//           weight[0] * wx0 * wy0 +
//           weight[1] * wx1 * wy0 +
//           weight[2] * wx0 * wy1 +
//           weight[3] * wx1 * wy1;
//         let val = 0;
//         if (sumWeight > 0) {
//           val =
//             (valid[0] * wx0 * wy0 +
//               valid[1] * wx1 * wy0 +
//               valid[2] * wx0 * wy1 +
//               valid[3] * wx1 * wy1) /
//             sumWeight;
//         }
//         [r, g, b, a] = valueToColor(val);
//       }

//       const idx = (py * canvas.width + px) * 4;
//       imgData.data[idx] = r;
//       imgData.data[idx + 1] = g;
//       imgData.data[idx + 2] = b;
//       imgData.data[idx + 3] = a; // 使用 alpha 控制透明度
//     }
//   }

//   ctx.putImageData(imgData, 0, 0);
//   drawGridOverlay(ctx, cssWidth, cssHeight);
// }
