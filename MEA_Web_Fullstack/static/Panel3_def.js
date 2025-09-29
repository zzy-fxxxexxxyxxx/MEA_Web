//------------------局部放大--------------------------------------------------------------------------
export function originalPeakEnlargement(processedData) {
  // 1️⃣ 从页面获取用户输入的开始时间等等
  const plotStartTime = parseFloat(document.getElementById("start_time").value);
  const intervalTime = parseFloat(
    document.getElementById("time_interval").value
  );
  const fs = processedData.fs;
  const voltageRange = parseFloat(document.getElementById("voltage").value);
  const tabValue = parseInt(document.getElementById("tab").value);

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
const channelData = Raw_data[tabIndex].slice(startIdx, endIdx);
   // 3️⃣1️⃣ 计算绝对时间
  const t = Array.from(
    { length: channelData.length },
    (_, i) => plotStartTime + i / fs
  );

  // 4️⃣ 绘制到 canvas
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");    //返回一个 绘图上下文对象，简称 ctx。这个对象提供了所有绘图方法

  // --- 高分辨率设置 ---
  const dpi = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  ctx.setTransform(dpi, 0, 0, dpi, 0, 0); // 用 setTransform 避免 scale 累积

  ctx.lineWidth = 0.5; // 线条适中
  ctx.strokeStyle = "black";

  ctx.clearRect(0, 0, width, height);   //清空画布原有内容

  // Canvas 坐标映射函数
  const xMin = plotStartTime,
    xMax = plotEndTime;
  const yMin = -voltageRange,
    yMax = voltageRange;

  const mapX = (x) => ((x - xMin) / (xMax - xMin)) * width;
  const mapY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

  // 4.1️⃣ 绘制波形
  ctx.beginPath();
  ctx.strokeStyle = "black";
  channelData.forEach((val, i) => {
    const x = mapX(t[i]);
    const y = mapY(val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // // 5️⃣ 绘制坐标轴
  // ctx.strokeStyle = "gray";
  // ctx.beginPath();
  // ctx.moveTo(mapX(xMin), mapY(0));
  // ctx.lineTo(mapX(xMax), mapY(0)); // X轴
  // ctx.moveTo(mapX(0), mapY(yMin));
  // ctx.lineTo(mapX(0), mapY(yMax)); // Y轴
  // ctx.stroke();
}
