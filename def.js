import * as h5wasm from "https://cdn.jsdelivr.net/npm/h5wasm@0.7.8/dist/esm/hdf5_hl.js";

// 定义切换 tab 的函数（参数化）
export function openTab(tabName, btn, allButtons, allContents) {
  // 隐藏所有内容
  allContents.forEach((tc) => (tc.style.display = "none"));
  // 移除所有按钮 active 样式
  allButtons.forEach((b) => b.classList.remove("active"));
  // 显示当前 tab 内容
  document.getElementById(tabName).style.display = "block";
  btn.classList.add("active");
}

// 定义画坐标轴函数
export function drawAxes(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return; // 如果没有这个canvas，就跳过
  const ctx = canvas.getContext("2d");
  // 清空
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // X轴
  ctx.beginPath();
  ctx.moveTo(20, canvas.height - 20);
  ctx.lineTo(canvas.width - 20, canvas.height - 20);
  ctx.stroke();
  // Y轴
  ctx.beginPath();
  ctx.moveTo(20, canvas.height - 20);
  ctx.lineTo(20, 20);
  ctx.stroke();
}

//-------------------------------数据预处理-----------------------------------------------------------------
export async function readH5File(file) {
  // 先把文件写入虚拟文件系统
  const buffer = await file.arrayBuffer();
  h5wasm.FS.writeFile(file.name, new Uint8Array(buffer));

  // 打开 HDF5 文件
  const f = new h5wasm.File(file.name, "r");

  // 递归读取 group/dataset
  function readGroup(group) {
    const obj = {};
    for (const key of group.keys()) {
      const item = group.get(key);
      if (item instanceof h5wasm.Group) {
        obj[key] = readGroup(item); // 递归读取子 group
      } else if (item instanceof h5wasm.Dataset) {
        obj[key] = item.value; // 读取 dataset 的值
      }
    }
    return obj;
  }

  const data = readGroup(f); // 从根目录开始读取
  f.close();
  return data;
}

export function mode(arr) {
  const freq = {};
  for (const v of arr) {
    freq[v] = (freq[v] || 0) + 1;
  }
  let best = null;
  let bestCount = -1;
  for (const [k, c] of Object.entries(freq)) {
    if (c > bestCount) {
      bestCount = c;
      best = k;
    }
  }
  return best === null ? null : Number(best);
}

// 预处理：从 InfoChannel / h5Data 提取基本量（并把 bigints 转为 Number）
export function preprocessH5Data(h5Data) {
  const result = {};

  const infoChannel = h5Data.Data.Recording_0.AnalogStream.Stream_0.InfoChannel;
  if (!infoChannel) throw new Error("InfoChannel 不存在");

  // 注意：我们假设 infoChannel 是“列式对象”（你之前已经做了 transpose）
  // 所以 infoChannel.Tick[0], infoChannel.Exponent[0] 等可用
  // 若不是，请先把它转成列式对象（或调整这里）
  const tick0 = infoChannel.Tick[0];
  const exp0 = infoChannel.Exponent[0];

  // 采样率 fs
  result.fs = 1e6 / tick0;

  // 单位
  result.dataUnit = Math.pow(10, exp0);

  // rawDataFactor（确保 ConversionFactor 中的 BigInt 转为 Number）
  result.rawDataFactor = (infoChannel.ConversionFactor || []).map((cf) =>
    cf * result.dataUnit
  );

  // layout：Label 可能为字符串或 cell，尝试 parseInt
  result.layout = [];
  const labels = infoChannel.Label || [];
  for (let i = 0; i < 60; i++) {
    const lab = labels[i];
    const parsed = parseInt(lab);
    result.layout.push(Number.isNaN(parsed) ? 0 : parsed);
  }

  return result;
}

// 把 ChannelData 变成 samples x channels 的二维数组，并乘上 rawDataFactor
// 支持三种常见情况：
// 1) channelData 已经是二维数组 [ [s0_ch0, s0_ch1,...], [s1_ch0,...], ... ]
// 2) channelData 是扁平的一维数组（TypedArray 或 Array），按 row-major 排列，每行是 numChannels 元素
// 3) channelData 是列式（不常见）——此处没有处理
export function getRawData(h5Data, rawDataFactor) {
  const channelData = h5Data.Data.Recording_0.AnalogStream.Stream_0.ChannelData;
  if (!channelData) throw new Error("ChannelData 不存在");

  const numChannels = rawDataFactor.length;
  if (!numChannels || numChannels <= 0) {
    throw new Error("rawDataFactor 长度无效，无法确定通道数");
  }

  // case A: already 2D array (Array of Arrays)
  if (Array.isArray(channelData) && channelData.length > 0 && Array.isArray(channelData[0])) {
    return channelData.map((row) => row.map((val, idx) => val * rawDataFactor[idx]));
  }

  // case B: typed array or flat JS array (扁平数组)
  if (ArrayBuffer.isView(channelData) || Array.isArray(channelData)) {
    // convert to normal array of numbers (for easier indexing)
    const flat = Array.from(channelData).map((v) => (typeof v === "bigint" ? Number(v) : v));
    const total = flat.length;
    const numSamples = Math.floor(total / numChannels);
    if (numSamples * numChannels !== total) {
      // 如果不能整除，给出警告但仍尝试按最小完整行数处理
      console.warn("ChannelData 长度不是 numChannels 的整数倍，按完整行数截断。", { total, numChannels, numSamples });
    }

    const Raw_data = new Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const base = i * numChannels;
      const row = new Array(numChannels);
      for (let ch = 0; ch < numChannels; ch++) {
        row[ch] = flat[base + ch] * rawDataFactor[ch];
      }
      Raw_data[i] = row;
    }
    return Raw_data;
  }

  // 未知情况，抛错以便调试
  throw new Error("未知的 ChannelData 格式，无法解析");
}

// 峰值检测（保留你原来的算法思路，但修正若干细节）
export function detectPeaks(Raw_data, thresholdFactor = 4, minPeakDistance = 170) {
  if (!Raw_data || Raw_data.length === 0) throw new Error("Raw_data 为空");
  const numSamples = Raw_data.length;
  const numChannels = Raw_data[0].length;

  // 我们用 MAX_PEAK_SLOTS 而不是 numSamples 作为峰的位置容器行数（更接近原 MATLAB 逻辑）
  const MAX_PEAK_SLOTS = 1000;
  const peakLocs = Array.from({ length: MAX_PEAK_SLOTS }, () => Array(numChannels).fill(NaN));
  const peakNum = Array(numChannels).fill(0);

  for (let ch = 0; ch < numChannels; ch++) {
    // 取某通道数据
    const channel = new Array(numSamples);
    for (let i = 0; i < numSamples; i++) channel[i] = Raw_data[i][ch];

    const meanVal = channel.reduce((a, b) => a + b, 0) / numSamples;
    const stdVal = Math.sqrt(channel.reduce((s, v) => s + (v - meanVal) * (v - meanVal), 0) / numSamples);
    const threshold = meanVal + thresholdFactor * stdVal;

    let lastPeak = -minPeakDistance;
    const locs = [];

    for (let i = 1; i < channel.length - 1; i++) {
      if (channel[i] > threshold && i - lastPeak >= minPeakDistance && channel[i] > channel[i-1] && channel[i] > channel[i+1]) {
        locs.push(i);
        lastPeak = i;
        if (locs.length >= MAX_PEAK_SLOTS) break;
      }
    }

    peakNum[ch] = locs.length;
    for (let k = 0; k < locs.length; k++) {
      peakLocs[k][ch] = locs[k];
    }
  }

  // active electrodes 判断（众数）
  const modePeakNum = mode(peakNum.filter((v) => v !== 0));
  const activeElectrodes = peakNum.map((n) => n === modePeakNum);

  // 仅保留 active electrodes 的数据
  const peakArriveTime = peakLocs.map((row) => row.map((val, ch) => (activeElectrodes[ch] ? val : NaN)));

  // 将以第一个 active electrode 为参考（若第一个通道没有有效数据需做判断）
  // 找到第一个 active 通道索引
  const firstActiveIdx = activeElectrodes.findIndex((v) => v);
  const peakArriveTimeDiff = peakArriveTime.map((row) =>
    row.map((val, ch) => {
      if (isNaN(val)) return NaN;
      const ref = row[firstActiveIdx];
      return isNaN(ref) ? NaN : val - ref;
    })
  );

  return { peakArriveTime: peakArriveTimeDiff, activeElectrodes };
}

// 综合预处理（顶层）
export async function data_preprocessing(h5Data) {
  const result = preprocessH5Data(h5Data);
  result.Raw_data = getRawData(h5Data, result.rawDataFactor);
  const { peakArriveTime, activeElectrodes } = detectPeaks(result.Raw_data);
  result.peakArriveTime = peakArriveTime;
  result.activeElectrodes = activeElectrodes;
  return result;
}
