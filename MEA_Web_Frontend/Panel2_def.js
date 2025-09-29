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
      ctx.arc(Math.round(cx) + 0.5, Math.round(cy) + 0.5, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ---------- 2) 绘制轴对齐的“缺角矩形”外边框（12 边形） ----------
  // 左上角点 (L,T) = (0,0)，右下角 (R,B) = (cssWidth, cssHeight)
  const L = 0;
  const T = 0;
  const R = cssWidth-1;
  const B = cssHeight-1;

  // 凹陷的实际像素值（以格子为单位）
  const nx = notchDepthCells * cellWidth;
  const ny = notchDepthCells * cellHeight;

  // 按顺时针列出 12 个顶点（保证每一段都是水平或垂直）
  const pts = [
    [L + nx, T],            // 0: top 从左边向右第一个点（越过左上缺口）
    [R - nx, T],            // 1: top 接近右上缺口
    [R - nx, T + ny],       // 2: 下降到右上凹陷内边
    [R, T + ny],            // 3: 小段水平到外边（右上内边/外边连接）
    [R, B - ny],            // 4: 沿右边向下到右下内边
    [R - nx, B - ny],       // 5: 向左越过右下缺口
    [R - nx, B],            // 6: 向下到最下边
    [L + nx, B],            // 7: 向左到左下内边开始处
    [L + nx, B - ny],       // 8: 向上到左下内边
    [L, B - ny],            // 9: 向左到外边（左下内/外连接）
    [L, T + ny],            //10: 向上到左上内边
    [L + nx, T + ny],       //11: 向右回到左上内边的水平点
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


// ---------- 连续无级渐变颜色（蓝->青->绿->黄->红） ----------
function getColorFromValue(value, minV, maxV, alpha = 1) {
  if (isNaN(value)) return `rgba(255,255,255,0)`; // NaN -> 透明

  if (minV === undefined || maxV === undefined) return `rgba(255,0,0,${alpha})`;
  const range = maxV - minV;
  const ratio = range === 0 ? 0.5 : Math.min(Math.max((value - minV) / range, 0), 1);

  const gradient = [
    { stop: 0.0, color: [0, 0, 255] },     // 蓝
    { stop: 0.25, color: [0, 255, 255] },  // 青
    { stop: 0.5, color: [0, 255, 0] },     // 绿
    { stop: 0.75, color: [255, 255, 0] },  // 黄
    { stop: 1.0, color: [255, 0, 0] }      // 红
  ];

  let left = gradient[0], right = gradient[gradient.length - 1];
  for (let i = 0; i < gradient.length - 1; i++) {
    if (ratio >= gradient[i].stop && ratio <= gradient[i + 1].stop) {
      left = gradient[i];
      right = gradient[i + 1];
      break;
    }
  }
  const t = (ratio - left.stop) / (right.stop - left.stop || 1);
  const r = Math.round(left.color[0] + t * (right.color[0] - left.color[0]));
  const g = Math.round(left.color[1] + t * (right.color[1] - left.color[1]));
  const b = Math.round(left.color[2] + t * (right.color[2] - left.color[2]));
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------- 双线性插值（处理 NaN） ----------
function bilinearInterpolateNaN(mat) {
  const rows = mat.length;
  const cols = mat[0].length;
  const res = mat.map(r => [...r]);

  // 收集有效点
  const pts = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v = res[i][j];
      if (!isNaN(v)) pts.push({ i, j, v });
    }
  }
  if (pts.length === 0) return res;

  // 对每个 NaN 点插值
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!isNaN(res[i][j])) continue;

      // 找到四个包围点（最接近的上下左右），容错：如果缺少某方向则用可用点替代
      let top = null, bottom = null;
      for (const p of pts) {
        if (p.j === j) {
          if (p.i <= i && (!top || p.i > top.i)) top = p;
          if (p.i >= i && (!bottom || p.i < bottom.i)) bottom = p;
        }
      }
      if (!top) top = bottom;
      if (!bottom) bottom = top;

      let left = null, right = null;
      for (const p of pts) {
        if (p.i === i) {
          if (p.j <= j && (!left || p.j > left.j)) left = p;
          if (p.j >= j && (!right || p.j < right.j)) right = p;
        }
      }
      if (!left) left = right;
      if (!right) right = left;

      // 如果能找到四角，做双线性插值；否则尽量用已有方向上最近的值
      if (top && bottom && left && right &&
          top.i !== bottom.i && left.j !== right.j) {
        const i1 = top.i, i2 = bottom.i, j1 = left.j, j2 = right.j;
        const Q11 = res[i1][j1], Q12 = res[i1][j2], Q21 = res[i2][j1], Q22 = res[i2][j2];
        const denom = (i2 - i1) * (j2 - j1);
        if (denom !== 0) {
          const val =
            (Q11 * (i2 - i) * (j2 - j) +
             Q21 * (i - i1) * (j2 - j) +
             Q12 * (i2 - i) * (j - j1) +
             Q22 * (i - i1) * (j - j1)) / denom;
          res[i][j] = val;
        } else {
          // 退化情况，取邻近非 NaN 值的平均
          const neigh = [Q11, Q12, Q21, Q22].filter(v => !isNaN(v));
          res[i][j] = neigh.length ? (neigh.reduce((a,b)=>a+b,0)/neigh.length) : NaN;
        }
      } else {
        // 找最近的单点作为填充（保证不会留下 NaN）
        if (top) res[i][j] = top.v;
        else if (bottom) res[i][j] = bottom.v;
        else if (left) res[i][j] = left.v;
        else if (right) res[i][j] = right.v;
      }
    }
  }
  return res;
}

// ---------- 在画热力图后覆盖绘制电极与凹角框（不改变画布尺寸） ----------
function drawGridOverlay(ctx, cssWidth, cssHeight) {
  const rows = 8, cols = 8, gridGap = 0;
  const cellWidth = (cssWidth - (cols - 1) * gridGap) / cols;
  const cellHeight = (cssHeight - (rows - 1) * gridGap) / rows;

  // 电极圆点
  const radius = Math.min(cellWidth, cellHeight) * 0.08;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r === 0 && c === 0) || (r === 0 && c === cols - 1) ||
          (r === rows - 1 && c === 0) || (r === rows - 1 && c === cols - 1)) {
        continue;
      }
      const cx = c * (cellWidth + gridGap) + cellWidth / 2;
      const cy = r * (cellHeight + gridGap) + cellHeight / 2;
      ctx.beginPath();
      ctx.arc(Math.round(cx) + 0.5, Math.round(cy) + 0.5, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 凹角框（12 点多边形）
  const notchDepthCells = 1;
  const L = 0, T = 0, R = cssWidth - 1, B = cssHeight - 1;
  const nx = notchDepthCells * cellWidth;
  const ny = notchDepthCells * cellHeight;
  const pts = [
    [L + nx, T], [R - nx, T], [R - nx, T + ny], [R, T + ny],
    [R, B - ny], [R - nx, B - ny], [R - nx, B], [L + nx, B],
    [L + nx, B - ny], [L, B - ny], [L, T + ny], [L + nx, T + ny],
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

// ---------- 主函数：绘制热力图（热力图在底，grid 在上） ----------
export function drawElectrodeHeatmap(processedData) {
  const canvas = document.getElementById("panel2Canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const panel = canvas.parentElement;
  if (!panel) return;

  const dpi = window.devicePixelRatio || 1;
  const cssWidth = panel.clientWidth * 0.9;
  const cssHeight = panel.clientHeight * 0.9;

  // 重新设置 canvas 尺寸（注意：设置 width/height 会清空 canvas）
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = Math.round(cssWidth * dpi);
  canvas.height = Math.round(cssHeight * dpi);

  // 把绘图坐标映射为 css 像素
  ctx.setTransform(dpi, 0, 0, dpi, 0, 0);

  // 先填白底（防止出现黑背景的视觉）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // 计算单元格大小
  const rows = 8, cols = 8, gridGap = 0;
  const cellWidth = (cssWidth - (cols - 1) * gridGap) / cols;
  const cellHeight = (cssHeight - (rows - 1) * gridGap) / rows;

  // 读取 t0 并取整与边界裁剪
  const t0Input = document.getElementById("time");
  let t0 = Math.round(Number(t0Input?.value) || 0);
  const peakMat = processedData.peakArriveTime || [];
  if (peakMat.length === 0) {
    // 没有数据，直接只绘制 grid
    drawGridOverlay(ctx, cssWidth, cssHeight);
    return;
  }
  t0 = Math.min(Math.max(t0, 0), peakMat.length - 1);

  // 读取 showBuffer（确保是数组并且长度至少为 processedData.layout.length）
  let showBuffer = Array.isArray(peakMat[t0]) ? [...peakMat[t0]] : null;
  if (!showBuffer) showBuffer = new Array(processedData.layout.length || 60).fill(NaN);

  // processedData 里 fs（若峰值已是 ms 则这里可以跳过）；为了兼容性：如果值看起来很大（>1e3），我们不二次乘 fs
  const fs = processedData.fs || 1;
  // 假设 peakArriveTime 已经是毫秒（若不是，请保证 preprocess 返回 ms），如果是采样点再转换：下面做保护性处理（如果最小值 > 1e3，认为已经是 ms）
  const minRaw = Math.min(...showBuffer.filter(v => !isNaN(v)));
  if (!isNaN(minRaw) && Math.abs(minRaw) < 1e3) {
    // 很可能是以采样点为单位 -> 转成 ms
    showBuffer = showBuffer.map(v => isNaN(v) ? NaN : (v / fs) * 1e3);
  }

  // 去基线（减去最小值以便色带从 0 开始）
  const numericVals = showBuffer.filter(v => !isNaN(v));
  const minVal = numericVals.length ? Math.min(...numericVals) : 0;
  showBuffer = showBuffer.map(v => (isNaN(v) ? NaN : v - minVal));

  // 构建 8x8 并映射 layout -> 网格坐标。MATLAB 用 (i,j) 对应 (x,y) 你之前的映射是 label = j*10 + i
  const heat = Array.from({ length: rows }, () => Array(cols).fill(NaN));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // 跳过四角与参考电极 (4,0) 即 i===4 && j===0
      if ((i === 0 || i === 7) && (j === 0 || j === 7)) continue;
      if (i === 4 && j === 0) continue;
      const label = j * 10 + i + 1;
      const idx = processedData.layout.indexOf(label);
      if (idx >= 0 && idx < showBuffer.length) heat[i][j] = showBuffer[idx];
    }
  }

  // 插值
  const interpHeat = bilinearInterpolateNaN(heat);

  // 计算整体 min/max 用于颜色映射
  const vals = interpHeat.flat().filter(v => !isNaN(v));
  const vmin = vals.length ? Math.min(...vals) : 0;
  const vmax = vals.length ? Math.max(...vals) : 1;

  // 绘制热力图（只绘制非 NaN 单元格）
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v = interpHeat[i][j];
      if (isNaN(v)) continue;
      const color = getColorFromValue(v, vmin, vmax, 1);
      ctx.fillStyle = color;
      ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
    }
  }

  // 最后在上层画网格/电极/框
  drawGridOverlay(ctx, cssWidth, cssHeight);
}
