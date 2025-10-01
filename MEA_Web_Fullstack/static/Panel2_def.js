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

//--------------------- 在 panel2 绘制电极阵列 + 轴对齐的四角凹陷边框 ------------------------
export function drawGridOnPanel2() {
  const canvas = document.getElementById("panel2Canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const panel = document.getElementById("panel2");
  if (!panel) return;

  const rows = 8;
  const cols = 8;
  const gridGap = 0; // 电极紧贴排列

  // 可调：四角凹陷深度（以格子数量为单位，1 = 一格深）
  const notchDepthCells = 1;

  // 高分屏适配
  const dpi = window.devicePixelRatio || 1;
  const cssWidth = panel.clientWidth * 0.9;
  const cssHeight = panel.clientHeight * 0.9;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = Math.round(cssWidth * dpi);
  canvas.height = Math.round(cssHeight * dpi);

  // 将绘图坐标映射为 css 像素坐标，之后使用 css 尺寸作坐标系
  ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // 每格尺寸
  const cellWidth = (cssWidth - (cols - 1) * gridGap) / cols;
  const cellHeight = (cssHeight - (rows - 1) * gridGap) / rows;

  // ---------- 1) 在每格中心画空心圆电极（跳过四角） ----------
  const radius = Math.min(cellWidth, cellHeight) * 0.08; // 你之前调整的大小
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 跳过真正缺失的四个角电极
      if (
        (r === 0 && c === 0) ||
        (r === 0 && c === cols - 1) ||
        (r === rows - 1 && c === 0) ||
        (r === rows - 1 && c === cols - 1)
      ) {
        continue;
      }
      const cx = c * (cellWidth + gridGap) + cellWidth / 2;
      const cy = r * (cellHeight + gridGap) + cellHeight / 2;
      // 对齐到像素中心保持线条清晰
      ctx.beginPath();
      ctx.arc(
        Math.round(cx) + 0.5,
        Math.round(cy) + 0.5,
        radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  // ---------- 2) 绘制轴对齐的“缺角矩形”外边框（12 边形） ----------
  // 左上角点 (L,T) = (0,0)，右下角 (R,B) = (cssWidth, cssHeight)
  const L = 0;
  const T = 0;
  const R = cssWidth - 1;
  const B = cssHeight - 1;

  // 凹陷的实际像素值（以格子为单位）
  const nx = notchDepthCells * cellWidth;
  const ny = notchDepthCells * cellHeight;

  // 按顺时针列出 12 个顶点（保证每一段都是水平或垂直）
  const pts = [
    [L + nx, T], // 0: top 从左边向右第一个点（越过左上缺口）
    [R - nx, T], // 1: top 接近右上缺口
    [R - nx, T + ny], // 2: 下降到右上凹陷内边
    [R, T + ny], // 3: 小段水平到外边（右上内边/外边连接）
    [R, B - ny], // 4: 沿右边向下到右下内边
    [R - nx, B - ny], // 5: 向左越过右下缺口
    [R - nx, B], // 6: 向下到最下边
    [L + nx, B], // 7: 向左到左下内边开始处
    [L + nx, B - ny], // 8: 向上到左下内边
    [L, B - ny], // 9: 向左到外边（左下内/外连接）
    [L, T + ny], //10: 向上到左上内边
    [L + nx, T + ny], //11: 向右回到左上内边的水平点
  ];

  // 画出多边形（使用 0.5 像素偏移来保证线条清晰）
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = Math.round(pts[i][0]) + 0.5;
    const py = Math.round(pts[i][1]) + 0.5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();
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

export function drawSmoothHeatmapTransparentCorners(
  data,
  colorPickValue = "color1"
) {
  const canvas = document.getElementById("panel2Canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const panel = document.getElementById("panel2");
  if (!panel) return;

  const rows = 9;
  const cols = 9;

  const dpi = window.devicePixelRatio || 1;
  const cssWidth = panel.clientWidth * 0.9;
  const cssHeight = panel.clientHeight * 0.9;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = Math.round(cssWidth * dpi);
  canvas.height = Math.round(cssHeight * dpi);
  ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const customColors = ChooseColor(colorPickValue);

  let minVal = Infinity,
    maxVal = -Infinity;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      if (!isNaN(data[i][j])) {
        minVal = Math.min(minVal, data[i][j]);
        maxVal = Math.max(maxVal, data[i][j]);
      }

  // 掩码矩阵：true=绘制，false=透明
  const mask = Array.from({ length: rows }, () => Array(cols).fill(true));
  mask[0][0] =
    mask[0][cols - 1] =
    mask[rows - 1][0] =
    mask[rows - 1][cols - 1] =
      false;

  // function valueToColor(val) {
  //   if (isNaN(val)) return [0, 0, 0, 0]; // alpha=0 表示透明
  //   const t = (val - minVal) / (maxVal - minVal);
  //   const idx = Math.floor(t * (customColors.length - 1));
  //   const [r, g, b] = customColors[idx];
  //   return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
  // }

  function valueToColor(val) {
    if (isNaN(val)) return [0, 0, 0, 0];
    const t = (val - minVal) / (maxVal - minVal);
    const scaled = t * (customColors.length - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx; // 小数部分

    const [r1, g1, b1] = customColors[idx];
    const [r2, g2, b2] =
      customColors[Math.min(idx + 1, customColors.length - 1)];

    const r = r1 + (r2 - r1) * frac;
    const g = g1 + (g2 - g1) * frac;
    const b = b1 + (b2 - b1) * frac;

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
  }

  const imgData = ctx.createImageData(canvas.width, canvas.height);
  for (let py = 0; py < canvas.height; py++) {
    for (let px = 0; px < canvas.width; px++) {
      const x = (px / canvas.width) * (cols - 1);
      const y = (py / canvas.height) * (rows - 1);

      const x0 = Math.floor(x),
        x1 = Math.min(x0 + 1, cols - 1);
      const y0 = Math.floor(y),
        y1 = Math.min(y0 + 1, rows - 1);

      // 四角透明判断
      let [r, g, b, a] = [0, 0, 0, 0]; // 默认透明
      if (mask[y0][x0] && mask[y0][x1] && mask[y1][x0] && mask[y1][x1]) {
        const v = [data[y0][x0], data[y0][x1], data[y1][x0], data[y1][x1]];
        const valid = v.map((vv) => (isNaN(vv) ? 0 : vv));
        const weight = v.map((vv) => (isNaN(vv) ? 0 : 1));

        const wx0 = 1 - (x - x0),
          wx1 = x - x0;
        const wy0 = 1 - (y - y0),
          wy1 = y - y0;

        const sumWeight =
          weight[0] * wx0 * wy0 +
          weight[1] * wx1 * wy0 +
          weight[2] * wx0 * wy1 +
          weight[3] * wx1 * wy1;
        let val = 0;
        if (sumWeight > 0) {
          val =
            (valid[0] * wx0 * wy0 +
              valid[1] * wx1 * wy0 +
              valid[2] * wx0 * wy1 +
              valid[3] * wx1 * wy1) /
            sumWeight;
        }
        [r, g, b, a] = valueToColor(val);
      }

      const idx = (py * canvas.width + px) * 4;
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = a; // 使用 alpha 控制透明度
    }
  }

  ctx.putImageData(imgData, 0, 0);
  drawGridOverlay(ctx, cssWidth, cssHeight);
}

// ---------- 在画热力图后覆盖绘制电极与凹角框（不改变画布尺寸） ----------
function drawGridOverlay(ctx, cssWidth, cssHeight) {
  const rows = 8,
    cols = 8,
    gridGap = 0;
  const cellWidth = (cssWidth - (cols - 1) * gridGap) / cols;
  const cellHeight = (cssHeight - (rows - 1) * gridGap) / rows;

  // 电极圆点
  const radius = Math.min(cellWidth, cellHeight) * 0.08;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (
        (r === 0 && c === 0) ||
        (r === 0 && c === cols - 1) ||
        (r === rows - 1 && c === 0) ||
        (r === rows - 1 && c === cols - 1)
      ) {
        continue;
      }
      const cx = c * (cellWidth + gridGap) + cellWidth / 2;
      const cy = r * (cellHeight + gridGap) + cellHeight / 2;
      ctx.beginPath();
      ctx.arc(
        Math.round(cx) + 0.5,
        Math.round(cy) + 0.5,
        radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  // 凹角框（12 点多边形）
  const notchDepthCells = 1;
  const L = 0,
    T = 0,
    R = cssWidth - 1,
    B = cssHeight - 1;
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
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = Math.round(pts[i][0]) + 0.5;
    const py = Math.round(pts[i][1]) + 0.5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();
}
