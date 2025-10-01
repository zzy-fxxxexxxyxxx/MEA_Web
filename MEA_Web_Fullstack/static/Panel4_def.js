//------------------绘制All Signals----------------------------------------------------------------------
export async function plotAllSignals(processedData) {
  // 1️⃣ 从页面获取用户输入
  const plotStartTime =
    parseFloat(document.getElementById("start_time3")?.value) || 1;
  const intervalTime =
    parseFloat(document.getElementById("time_interval3")?.value) || 0.1;
  const voltageRange =
    parseFloat(document.getElementById("voltage3")?.value) || 0.0001;
  const tabValue = parseInt(document.getElementById("tab3")?.value) || 44;

  const layout = processedData.layout;
  const Raw_data = processedData.Raw_data;
  const fs = processedData.fs;

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

  console.log({startIdx});
  console.log({endIdx});
  console.log({channelData});
  console.log({fs});
  

  // 3️⃣1️⃣ 计算绝对时间
  const t = Array.from({ length: channelData.length }, (_, i) => plotStartTime + i / fs);

  // 4️⃣ 调用后端处理信号（Python 包计算 clean 信号和 rpeaks）
  let clean = [];
  let rpeaks = [];
  try {
    const response = await fetch("/process_signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal: channelData, fs })
    });
    const result = await response.json();
    if (result.error) {
      alert("Error: " + result.error);
      return;
    }
    clean = result.clean;
    rpeaks = result.rpeaks.map(idx => idx / fs + plotStartTime);
  } catch (err) {
    alert("调用后端处理失败: " + err);
    return;
  }

  // 5️⃣ 绘制到 canvas
  const canvas = document.getElementById("canvas2");
  const ctx = canvas.getContext("2d");

  // --- 高分辨率设置 ---
  const dpi = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  ctx.setTransform(dpi, 0, 0, dpi, 0, 0);

  ctx.lineWidth = 0.5;
  ctx.clearRect(0, 0, width, height);

  // 坐标映射函数
  const mapX = (x) => ((x - plotStartTime) / intervalTime) * width;
  const mapY = (y) => height / 2 - (y / voltageRange) * (height / 2);

  // 5.1️⃣ 绘制原始信号 (黑色)
  ctx.beginPath();
  ctx.strokeStyle = "green";
  channelData.forEach((val, i) => {
    const x = mapX(t[i]);
    const y = mapY(val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 5.2️⃣ 绘制清理后的信号 (蓝色)
  ctx.beginPath();
  ctx.strokeStyle = "blue";
  clean.forEach((val, i) => {
    const x = mapX(t[i]);
    const y = mapY(val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 5.3️⃣ 绘制 R 波虚线 (红色)
  ctx.strokeStyle = "red";
  rpeaks.forEach(time => {
    const x = mapX(time);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  });
}
