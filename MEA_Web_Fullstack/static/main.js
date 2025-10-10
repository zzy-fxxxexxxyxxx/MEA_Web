import * as h5wasm from "https://cdn.jsdelivr.net/npm/h5wasm@0.7.8/dist/esm/hdf5_hl.js";

// import { openTab, drawAxes } from "/static/def.js";
// import { data_preprocessing, mode, readH5File } from "/static/DataProcess.js";
// import { drawGridOnPanel1, plotWaveformsOnGrid } from "/static/Panel1_def.js";
// import { originalPeakEnlargement } from "/static/Panel3_def.js";
// import { drawGridOnPanel2, drawElectrodeHeatmap } from "/static/Panel2_def.js";

import { openTab, drawAxes } from "./basic_func.js";
import {
  toNumberIfBigInt,
  data_preprocessing,
  readH5File,
  detectPeaks,
} from "./DataProcess.js";
import { drawGridOnPanel1, plotWaveformsOnGrid } from "./Panel1_def.js";
import { originalPeakEnlargement } from "./Panel3_def.js";
import {
  drawGridOnPanel2,
  HeatCalculate,
  drawSmoothHeatmapTransparentCorners,
  drawArrow,
} from "./Panel2_def.js";
import { plotAllSignals } from "./Panel4_def.js";

//------------------------------------DOMContentLoaded----------------------------------------------------------------

// 等页面加载完成再执行下面的逻辑
document.addEventListener("DOMContentLoaded", async () => {
  // 获取所有按钮和内容
  const tabButtons = document.querySelectorAll(".tablinks");
  const tabContents = document.querySelectorAll(".tabcontent");
  // 左侧顶端tab选择，给按钮绑定事件
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      openTab(tabName, btn, tabButtons, tabContents);
    });
  });
  // 默认打开第一个 tab
  if (tabButtons.length > 0) {
    openTab(tabButtons[0].dataset.tab, tabButtons[0], tabButtons, tabContents);
  }

  // 画 panel3 和 panel4 的坐标系
  drawAxes("chart1");
  drawAxes("chart2");

  //---------------------------数据预处理-------------------------
  await h5wasm.ready; // 等待 wasm 初始化完成

  let processedData = null; // 外部定义

  document.getElementById("submitBtn").addEventListener("click", async () => {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "HDF5 files",
          accept: { "application/octet-stream": [".h5"] },
        },
      ],
    });
    const file = await fileHandle.getFile();

    // 读h5
    const h5Data = await readH5File(file);
    console.log(h5Data); // 查看所有层级和 dataset 内容

    h5Data.Data.Recording_0.AnalogStream.Stream_0.InfoChannel =
      h5Data.Data.Recording_0.AnalogStream.Stream_0.InfoChannel.map((row) => {
        return {
          ChannelID: toNumberIfBigInt(row[0]),
          RowIndex: toNumberIfBigInt(row[1]),
          GroupID: toNumberIfBigInt(row[2]),
          ElectrodeGroup: toNumberIfBigInt(row[3]),
          Label: row[4],
          RawDataType: row[5],
          Unit: row[6],
          Exponent: toNumberIfBigInt(row[7]),
          ADZero: toNumberIfBigInt(row[8]),
          Tick: toNumberIfBigInt(row[9]),
          ConversionFactor: toNumberIfBigInt(row[10]),
          ADCBits: toNumberIfBigInt(row[11]),
          HighPassFilterType: row[12],
          HighPassFilterCutOffFrequency: row[13],
        };
      });

    function transposeInfoChannel(infoChannelArray) {
      const result = {};
      // 遍历所有行（对象）
      infoChannelArray.forEach((row) => {
        Object.entries(row).forEach(([key, value]) => {
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(value);
        });
      });
      return result;
    }

    h5Data.Data.Recording_0.AnalogStream.Stream_0.InfoChannel =
      transposeInfoChannel(
        h5Data.Data.Recording_0.AnalogStream.Stream_0.InfoChannel
      );

    console.log(
      "改造后的 InfoChannel:",
      h5Data.Data.Recording_0.AnalogStream.Stream_0.InfoChannel
    );
    document.getElementById("output").textContent += "\n文件读取成功 ✅\n";

    processedData = await data_preprocessing(h5Data);

    console.log("fs:", processedData.fs);
    console.log("Raw_data:", processedData.Raw_data[1][0]);
    console.log("layout:", processedData.layout);

    // ✅ 设置 input 的值为文件名
    document.getElementById("filename").value = file.name;
    document.getElementById("total_time").value =
      processedData.Raw_data[0].length / processedData.fs;
  });

  //------------------------------------Panel 1,2初始化--------------------------------------------------------------------
  drawGridOnPanel1();
  drawGridOnPanel2();

  //------------------------------------Panel 1，3--------------------------------------------------------------------
  document.getElementById("plot1").addEventListener("click", () => {
    plotWaveformsOnGrid(processedData); // processedData 是你 data_preprocessing 的结果
    originalPeakEnlargement(processedData); // processedData 是你前面 data_preprocessing 的结果
  });

  //------------------------------------Panel 2--------------------------------------------------------------------

  document
    .getElementById("discharge_detection")
    .addEventListener("click", async () => {
      // 🔹 异步执行 detectPeaks
      processedData = await detectPeaks(processedData, 60, 4);
      document.getElementById("detection_result").value =
        processedData.peakArriveTime.length;

      // 🔹 执行完成后恢复输入框可用并修改 title
      document.getElementById("epoch").title =
        "请输入不可超过放电次数的正整数";

      const epochInput = document.getElementById("epoch");

      epochInput.disabled = false;
      epochInput.value = 1;
      epochInput.max = processedData.peakArriveTime.length;
      document.getElementById("time").value =
        processedData.peakBaseTimes[document.getElementById("epoch").value - 1];

      epochInput.addEventListener("blur", () => {
        const min = parseInt(epochInput.min, 10);
        const max = parseInt(epochInput.max, 10);
        const value = Number(epochInput.value);

        // 检查是否为整数
        if (!Number.isInteger(value)) {
          alert("请输入整数！");
          epochInput.value = 1;
          epochInput.focus();
          return;
        }

        // 检查范围
        if (value < min || value > max) {
          alert(`输入必须在 ${min} 和 ${max} 之间！`);
          epochInput.value = 1;
          epochInput.focus();
          return;
        }

        // ✅ 合法值 -> 可以继续执行后面逻辑
        // console.log("输入合法，可以继续执行逻辑:", value);
        document.getElementById("time").value =
          processedData.peakBaseTimes[
            document.getElementById("epoch").value - 1
          ];
      });
    });

  let HeatMapData = null;

  document.getElementById("plot2").addEventListener("click", async () => {
    // drawElectrodeHeatmap(processedData);

    const t0Input = document.getElementById("epoch");
    let t0 = Math.round(Number(t0Input?.value) || 0);

    HeatMapData = await HeatCalculate(
      processedData.peakArriveTime[t0 - 1], //减去1来对其索引
      processedData.fs,
      processedData.layout
    );

    drawSmoothHeatmapTransparentCorners(HeatMapData, "color1");
  });

  document.getElementById("arrow").addEventListener("click", async () => {
    if (!HeatMapData) {
      alert("HeatMapData 还没有生成，请先点击 plot2 按钮！");
      return;
    }
    console.log("用来画箭头的HeatMapData:", HeatMapData);
    drawArrow(HeatMapData, 2);
  });

  document.getElementById("plot3").addEventListener("click", async () => {
    // 调用封装好的函数绘制
    await plotAllSignals(processedData);
  });
});
