//---------------------------有坐标轴，有降采样-----------------------------------------------
export function originalPeakEnlargement(processedData) {
  // 1️⃣ 从页面获取用户输入的开始时间等等
  const plotStartTime = parseFloat(
    document.getElementById("start_time1").value
  );
  const intervalTime = parseFloat(
    document.getElementById("time_interval1").value
  );
  const fs = processedData.fs;
  const voltageRange =
    parseFloat(document.getElementById("voltage1").value) / 1000000;
  const tabValue = parseInt(document.getElementById("tab1").value);

  const layout = processedData.layout;
  const Raw_data = processedData.Raw_data;

  const plotEndTime = plotStartTime + intervalTime;
  const numSamples = Math.floor(intervalTime * fs);
  const startIdx = Math.floor(plotStartTime * fs);
  const endIdx = startIdx + numSamples;

  // 2️⃣ 计算通道坐标
  const columnValue = Math.floor(tabValue / 10);
  const lineValue = tabValue % 10;
  const tabIndex = layout.indexOf(tabValue);

  if (
    (lineValue === 1 || lineValue === 8) &&
    (columnValue === 1 || columnValue === 8)
  ) {
    alert("不存在该通道");
    return;
  } else if (lineValue === 5 && columnValue === 1) {
    alert("参考电压");
    return;
  } else if (
    lineValue < 1 ||
    lineValue > 8 ||
    columnValue < 1 ||
    columnValue > 8
  ) {
    alert("不存在该通道");
    return;
  }

  // 3️⃣ 获取绘图数据
  let channelData = Raw_data[tabIndex].slice(startIdx, endIdx);

  // 3️⃣1️⃣ 判断是否需要降采样
  let DOWNSAMPLE_FACTOR = 1;
  if (intervalTime > 5) {
    // 如果 intervalTime 超过 5 秒
    DOWNSAMPLE_FACTOR = 5;
    const downsampled = [];
    for (let i = 0; i < channelData.length; i += DOWNSAMPLE_FACTOR) {
      downsampled.push(channelData[i]);
    }
    channelData = downsampled;
  }

  const t = Array.from(
    { length: channelData.length },
    (_, i) => plotStartTime + (i / fs) * DOWNSAMPLE_FACTOR
  );

  // 4️⃣ 绘制到 canvas
  const canvas = document.getElementById("canvas1");

  const rect = canvas.parentElement.getBoundingClientRect();
  if (!rect) return;

  const width = rect.width;
  const height = rect.height;
  // CSS 显示大小
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");

  const dpi = window.devicePixelRatio || 1;
  // const width = canvas.clientWidth;
  // const height = canvas.clientHeight;
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  ctx.setTransform(dpi, 0, 0, dpi, 0, 0);

  ctx.clearRect(0, 0, width, height);

  // --- 留出边距给坐标轴 ---
  const marginLeft = 50;
  const marginBottom = 40;
  const marginTop = 20;
  const marginRight = 20;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // 坐标映射函数
  const mapX = (x) =>
    marginLeft + ((x - plotStartTime) / intervalTime) * plotWidth;
  const mapY = (y) =>
    marginTop +
    plotHeight -
    ((y + voltageRange) / (2 * voltageRange)) * plotHeight;

  // 4.1️⃣ 绘制波形
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  channelData.forEach((val, i) => {
    // 🔹 限制电压值，截断超出范围的部分
    const clampedVal = Math.max(Math.min(val, voltageRange), -voltageRange);

    const x = mapX(t[i]);
    const y = mapY(clampedVal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 5️⃣ 绘制坐标轴
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;

  // Y 轴
  ctx.beginPath();
  ctx.moveTo(marginLeft, marginTop - 5);
  ctx.lineTo(marginLeft, marginTop + plotHeight);
  ctx.stroke();

  // X 轴
  ctx.beginPath();
  ctx.moveTo(marginLeft, marginTop + plotHeight);
  ctx.lineTo(marginLeft + plotWidth + 5, marginTop + plotHeight);
  ctx.stroke();

  // 6️⃣ 绘制刻度和文字
  ctx.fillStyle = "#000";
  ctx.font = "8px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  // Y 轴刻度
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = -voltageRange + (i * 2 * voltageRange) / yTicks;
    const yPos = mapY(yVal);
    ctx.beginPath();
    ctx.moveTo(marginLeft - 5, yPos);
    ctx.lineTo(marginLeft, yPos);
    ctx.stroke();
    ctx.fillText(`${(1000000 * yVal).toFixed(1)} μV`, marginLeft - 8, yPos);
  }

  // X 轴刻度
  const xTicks = 5;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= xTicks; i++) {
    const xVal = plotStartTime + (i * intervalTime) / xTicks;
    const xPos = mapX(xVal);
    ctx.beginPath();
    ctx.moveTo(xPos, marginTop + plotHeight);
    ctx.lineTo(xPos, marginTop + plotHeight + 5);
    ctx.stroke();
    ctx.fillText(`${xVal.toFixed(2)} s`, xPos, marginTop + plotHeight + 8);
  }

  // 坐标轴单位
  ctx.textAlign = "center";
  ctx.fillText(
    "Time (s)",
    marginLeft + plotWidth / 2,
    marginTop + plotHeight + 16
  );
  ctx.save();
  ctx.translate(marginLeft - 50, marginTop + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Voltage (μV)", 0, 0);
  ctx.restore();

  canvas.dataset.hasContent = "true";
}

//---------------------------有坐标轴，没有降采样-----------------------------------------------
// export function originalPeakEnlargement(processedData) {
//   // 1️⃣ 从页面获取用户输入的开始时间等等
//   const plotStartTime = parseFloat(
//     document.getElementById("start_time1").value
//   );
//   const intervalTime = parseFloat(
//     document.getElementById("time_interval1").value
//   );
//   const fs = processedData.fs;
//   const voltageRange = parseFloat(document.getElementById("voltage1").value )/1000000;
//   const tabValue = parseInt(document.getElementById("tab1").value);

//   const layout = processedData.layout;
//   const Raw_data = processedData.Raw_data;

//   const plotEndTime = plotStartTime + intervalTime;
//   const numSamples = Math.floor(intervalTime * fs);
//   const startIdx = Math.floor(plotStartTime * fs);
//   const endIdx = startIdx + numSamples;

//   // 2️⃣ 计算通道坐标
//   const columnValue = Math.floor(tabValue / 10);
//   const lineValue = tabValue % 10;
//   const tabIndex = layout.indexOf(tabValue);

//   if (
//     (lineValue === 1 || lineValue === 8) &&
//     (columnValue === 1 || columnValue === 8)
//   ) {
//     alert("不存在该通道");
//     return;
//   } else if (lineValue === 5 && columnValue === 1) {
//     alert("参考电压");
//     return;
//   } else if (
//     lineValue < 1 ||
//     lineValue > 8 ||
//     columnValue < 1 ||
//     columnValue > 8
//   ) {
//     alert("不存在该通道");
//     return;
//   }

//   // 3️⃣ 获取绘图数据
//   const channelData = Raw_data[tabIndex].slice(startIdx, endIdx);
//   const t = Array.from(
//     { length: channelData.length },
//     (_, i) => plotStartTime + i / fs
//   );

//   // 4️⃣ 绘制到 canvas
//   const canvas = document.getElementById("canvas1");
//   const ctx = canvas.getContext("2d");

//   const dpi = window.devicePixelRatio || 1;
//   const width = canvas.clientWidth;
//   const height = canvas.clientHeight;
//   canvas.width = width * dpi;
//   canvas.height = height * dpi;
//   ctx.setTransform(dpi, 0, 0, dpi, 0, 0);

//   ctx.clearRect(0, 0, width, height);

//   // --- 留出边距给坐标轴 ---
//   const marginLeft = 50;
//   const marginBottom = 40;
//   const marginTop = 20;
//   const marginRight = 20;

//   const plotWidth = width - marginLeft - marginRight;
//   const plotHeight = height - marginTop - marginBottom;

//   // 坐标映射函数
//   const mapX = (x) =>
//     marginLeft + ((x - plotStartTime) / intervalTime) * plotWidth;
//   const mapY = (y) =>
//     marginTop + plotHeight - ((y + voltageRange) / (2 * voltageRange)) * plotHeight;

//   // 4.1️⃣ 绘制波形
//   ctx.beginPath();
//   ctx.strokeStyle = "black";
//   ctx.lineWidth = 1;
//   channelData.forEach((val, i) => {
//     const x = mapX(t[i]);
//     const y = mapY(val);
//     if (i === 0) ctx.moveTo(x, y);
//     else ctx.lineTo(x, y);
//   });
//   ctx.stroke();

//   // 5️⃣ 绘制坐标轴
//   ctx.strokeStyle = "#888";
//   ctx.lineWidth = 1;

//   // Y 轴
//   ctx.beginPath();
//   ctx.moveTo(marginLeft, marginTop-5);
//   ctx.lineTo(marginLeft, marginTop + plotHeight);
//   ctx.stroke();

//   // X 轴
//   ctx.beginPath();
//   ctx.moveTo(marginLeft, marginTop + plotHeight);
//   ctx.lineTo(marginLeft + plotWidth+5, marginTop + plotHeight);
//   ctx.stroke();

//   // 6️⃣ 绘制刻度和文字
//   ctx.fillStyle = "#000";
//   ctx.font = "8px sans-serif";
//   ctx.textAlign = "right";
//   ctx.textBaseline = "middle";

//   // Y 轴刻度
//   const yTicks = 5;
//   for (let i = 0; i <= yTicks; i++) {
//     const yVal = -voltageRange + (i * 2 * voltageRange) / yTicks;
//     const yPos = mapY(yVal);
//     ctx.beginPath();
//     ctx.moveTo(marginLeft - 5, yPos);
//     ctx.lineTo(marginLeft, yPos);
//     ctx.stroke();
//     ctx.fillText(`${(1000000 * yVal).toFixed(1)} μV`, marginLeft - 8, yPos);
//   }

//   // X 轴刻度
//   const xTicks = 5;
//   ctx.textAlign = "center";
//   ctx.textBaseline = "top";
//   for (let i = 0; i <= xTicks; i++) {
//     const xVal = plotStartTime + (i * intervalTime) / xTicks;
//     const xPos = mapX(xVal);
//     ctx.beginPath();
//     ctx.moveTo(xPos, marginTop + plotHeight);
//     ctx.lineTo(xPos, marginTop + plotHeight + 5);
//     ctx.stroke();
//     ctx.fillText(`${xVal.toFixed(2)} s`, xPos, marginTop + plotHeight + 8);
//   }

//   // 坐标轴单位
//   ctx.textAlign = "center";
//   ctx.fillText("Time (s)", marginLeft + plotWidth / 2, marginTop + plotHeight + 16);
//   ctx.save();
//   ctx.translate(marginLeft - 50, marginTop + plotHeight / 2);
//   ctx.rotate(-Math.PI / 2);
//   ctx.textAlign = "center";
//   ctx.fillText("Voltage (μV)", 0, 0);
//   ctx.restore();
// }

// //------------------局部放大，没有坐标轴--------------------------------------------------------------------------
// export function originalPeakEnlargement(processedData) {
//   // 1️⃣ 从页面获取用户输入的开始时间等等
//   const plotStartTime = parseFloat(
//     document.getElementById("start_time1").value
//   );
//   const intervalTime = parseFloat(
//     document.getElementById("time_interval1").value
//   );
//   const fs = processedData.fs;
//   const voltageRange = parseFloat(document.getElementById("voltage1").value);
//   const tabValue = parseInt(document.getElementById("tab1").value);

//   const layout = processedData.layout;
//   const Raw_data = processedData.Raw_data;

//   const plotEndTime = plotStartTime + intervalTime;
//   const numSamples = Math.floor(intervalTime * fs);
//   const startIdx = Math.floor(plotStartTime * fs);
//   const endIdx = startIdx + numSamples;

//   // 2️⃣ 计算通道坐标
//   const columnValue = Math.floor(tabValue / 10);
//   const lineValue = tabValue % 10;
//   const tabIndex = layout.indexOf(tabValue);

//   if (
//     (lineValue === 1 || lineValue === 8) &&
//     (columnValue === 1 || columnValue === 8)
//   ) {
//     alert("不存在该通道");
//     return;
//   } else if (lineValue === 5 && columnValue === 1) {
//     alert("参考电压");
//     return;
//   } else if (
//     lineValue < 1 ||
//     lineValue > 8 ||
//     columnValue < 1 ||
//     columnValue > 8
//   ) {
//     alert("不存在该通道");
//     return;
//   }

//   // 3️⃣ 获取绘图数据
//   const channelData = Raw_data[tabIndex].slice(startIdx, endIdx);
//   // 3️⃣1️⃣ 计算绝对时间
//   const t = Array.from(
//     { length: channelData.length },
//     (_, i) => plotStartTime + i / fs
//   );

//   // 4️⃣ 绘制到 canvas
//   const canvas = document.getElementById("canvas1");
//   const ctx = canvas.getContext("2d"); //返回一个 绘图上下文对象，简称 ctx。这个对象提供了所有绘图方法

//   // --- 高分辨率设置 ---
//   const dpi = window.devicePixelRatio || 1;
//   const width = canvas.clientWidth;
//   const height = canvas.clientHeight;
//   canvas.width = width * dpi;
//   canvas.height = height * dpi;
//   ctx.setTransform(dpi, 0, 0, dpi, 0, 0); // 用 setTransform 避免 scale 累积

//   ctx.lineWidth = 0.5; // 线条适中
//   ctx.strokeStyle = "black";

//   ctx.clearRect(0, 0, width, height); //清空画布原有内容

//   // Canvas 坐标映射函数
//   const xMin = plotStartTime,
//     xMax = plotEndTime;
//   const yMin = -voltageRange,
//     yMax = voltageRange;

//   const mapX = (x) => ((x - xMin) / (xMax - xMin)) * width;
//   const mapY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

//   // 4.1️⃣ 绘制波形
//   ctx.beginPath();
//   ctx.strokeStyle = "black";
//   channelData.forEach((val, i) => {
//     const x = mapX(t[i]);
//     const y = mapY(val);
//     if (i === 0) ctx.moveTo(x, y);
//     else ctx.lineTo(x, y);
//   });
//   ctx.stroke();

//   // // 5️⃣ 绘制坐标轴
//   // ctx.strokeStyle = "gray";
//   // ctx.beginPath();
//   // ctx.moveTo(mapX(xMin), mapY(0));
//   // ctx.lineTo(mapX(xMax), mapY(0)); // X轴
//   // ctx.moveTo(mapX(0), mapY(yMin));
//   // ctx.lineTo(mapX(0), mapY(yMax)); // Y轴
//   // ctx.stroke();
// }
