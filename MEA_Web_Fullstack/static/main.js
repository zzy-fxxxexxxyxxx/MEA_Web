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
import { saveCanvasWithTimestamp, saveSVGWithFormat } from "./Save.js";

import { showToastById } from "./Beautify.js";

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
  //------------------------------大板块点击变蓝----------------------------------------
  document.querySelectorAll(".grid > div").forEach((item) => {
    item.addEventListener("click", function () {
      // 移除所有选中状态
      document.querySelectorAll(".grid > div").forEach((el) => {
        el.classList.remove(
          "bg-primary/10",
          "border-2",
          "border-primary",
          "text-primary",
          "font-bold"
        );
        el.classList.add(
          "bg-white",
          "border",
          "border-gray-200",
          "text-gray-500"
        );
      });

      // 设置当前选中状态
      this.classList.remove(
        "bg-white",
        "border",
        "border-gray-200",
        "text-gray-500"
      );
      this.classList.add(
        "bg-primary/10",
        "border-2",
        "border-primary",
        "text-primary",
        "font-bold"
      );
    });
  });

  //---------------------------------------------颜色选择器-------------------------------------
  // const gradients = {
  //   color1:
  //     "linear-gradient(to right, #007b9a, #00a8cc, #66cbe9, #84d3ea, #a9deec, #d1ecf3, #fafeff, #fde4c8, #fdc999, #faab68, #f68d37, #ca5a28, #984221)",
  //   color2: "linear-gradient(to right, #88A2C7, #77B3DF, #95CB62, #FADC7E)",
  //   color3:
  //     "linear-gradient(to right, #a60026, #bf1927, #d93328, #e85337, #f57446, #fa9656, #fdb668, #fed081, #fee79a, #fff7b3, #f7fcce, #e7f6ec, #cfebf3, #b3ddeb, #97c9e0, #7ab2d4, #6095c5, #4778b6, #3c57a5, #313695)",
  //   color4:
  //     "linear-gradient(to right, #5C1877, #AA3379, #FFAA76, #FEECAF, #FFD3B6)",
  //   color5:
  //     "linear-gradient(to right, #79a6ce, #aed2e5, #f0f8dc, #fdf7b4, #ffe69a)",
  //   color6:
  //     "linear-gradient(to right, #6B95C5, #A5DEF1, #ACD7A8, #FAAD73, #FAE791)",
  //   color7:
  //     "linear-gradient(to right, #000000, #FF0000, #FF7F00, #FFD700, #FFFF00)",
  // };

  // const selectTrigger = document.getElementById("selectTrigger");
  // const selectOptions = document.getElementById("selectOptions");
  // const selectedColorPreview = document.getElementById("selectedColorPreview");
  // const body = document.body;

  // // 初始化选项预览
  // for (let i = 1; i <= 7; i++) {
  //   const preview = document.getElementById(`preview-color${i}`);
  //   if (preview) preview.style.backgroundImage = gradients[`color${i}`];
  // }

  // // 显示下拉
  // selectTrigger.addEventListener("click", (e) => {
  //   e.stopPropagation();
  //   selectOptions.classList.toggle("visible");
  //   selectTrigger.classList.toggle("active");
  // });

  // // 选项点击
  // document.querySelectorAll(".option").forEach((option) => {
  //   option.addEventListener("click", () => {
  //     const value = option.getAttribute("data-value");
  //     if (!gradients[value]) return;
  //     selectedColorPreview.style.backgroundImage = gradients[value];
  //     selectedColorPreview.style.border = "1px solid #000"; // 高亮边框
  //     body.style.backgroundImage = gradients[value];
  //     selectOptions.classList.remove("visible");
  //     selectTrigger.classList.remove("active");
  //   });
  // });

  // // 点击页面其他区域关闭下拉
  // document.addEventListener("click", () => {
  //   selectOptions.classList.remove("visible");
  //   selectTrigger.classList.remove("active");
  // });

  // // 默认显示第一个颜色
  // selectedColorPreview.style.backgroundImage = gradients.color1;
  // body.style.backgroundImage = gradients.color1;

  //----------------------------------------------------------------------------------
  // 画 panel3 和 panel4 的坐标系
  drawAxes("chart1");
  drawAxes("chart2");

  //---------------------------数据预处理-------------------------

  // 等待 h5wasm 初始化完成
  await h5wasm.ready;

  let processedData = null;

  // 绑定按钮点击事件
  document.getElementById("submitBtn").addEventListener("click", async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "HDF5 files",
            accept: { "application/octet-stream": [".h5"] },
          },
        ],
      });
      const file = await fileHandle.getFile();

      // 先显示 toast，告诉用户文件正在加载
      showToastById("toast1", "文件加载中... ⏳", 2000);

      // 等浏览器先渲染 toast，再执行耗时操作
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 读取 HDF5 文件
      const h5Data = await readH5File(file);
      console.log("原始 h5Data:", h5Data);

      // 转换 InfoChannel 数据
      const stream0 = h5Data.Data.Recording_0.AnalogStream.Stream_0;
      stream0.InfoChannel = stream0.InfoChannel.map((row) => ({
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
      }));

      // 转置 InfoChannel
      function transposeInfoChannel(infoChannelArray) {
        const result = {};
        infoChannelArray.forEach((row) => {
          Object.entries(row).forEach(([key, value]) => {
            if (!result[key]) result[key] = [];
            result[key].push(value);
          });
        });
        return result;
      }
      stream0.InfoChannel = transposeInfoChannel(stream0.InfoChannel);
      console.log("改造后的 InfoChannel:", stream0.InfoChannel);

      // 数据预处理
      processedData = await data_preprocessing(h5Data);

      // 更新文件名和总时长
      document.getElementById("filename").value = file.name;
      document.getElementById("total_time").value =
        processedData.Raw_data[0].length / processedData.fs;

      // 最终显示 toast 提示读取完成
      showToastById("toast1", "读取文件成功 ✅", 1000);
    } catch (err) {
      console.error(err);
      showToastById("toast1", "文件读取失败 ❌", 1000);
    }
  });

  //------------------------------------Panel 1,2初始化--------------------------------------------------------------------
  drawGridOnPanel1();
  drawGridOnPanel2();

  //------------------------------------Panel 1，3--------------------------------------------------------------------
  document.getElementById("plot1").addEventListener("click", () => {
    plotWaveformsOnGrid(processedData); // processedData 是你 data_preprocessing 的结果

    if (document.getElementById("tab1").value != 0) {
      originalPeakEnlargement(processedData); // processedData 是你前面 data_preprocessing 的结果
    }
  });

  //------------------------------------Panel 2--------------------------------------------------------------------

  // discharge_detection 按钮事件
  document
    .getElementById("discharge_detection")
    .addEventListener("click", async () => {
      try {
        // 🔹 显示“放电检测中”
        showToastById("toast2", "放电检测中... ⏳", 200); // 0 表示持续显示

        // 🔹 延迟 50ms 让浏览器先渲染 toast
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 🔹 异步执行 detectPeaks
        processedData = await detectPeaks(processedData, 60, 4);

        // 🔹 更新检测结果
        document.getElementById("detection_result").value =
          processedData.peakArriveTime.length;

        const epochInput = document.getElementById("epoch");
        epochInput.disabled = false;
        epochInput.title = "请输入不可超过放电次数的正整数";
        epochInput.value = 1;
        epochInput.max = processedData.peakArriveTime.length;
        document.getElementById("time").value =
          processedData.peakBaseTimes[epochInput.value - 1];

        epochInput.addEventListener("blur", () => {
          const min = parseInt(epochInput.min, 10);
          const max = parseInt(epochInput.max, 10);
          const value = Number(epochInput.value);

          if (!Number.isInteger(value) || value < min || value > max) {
            alert(`请输入 ${min}-${max} 的整数！`);
            epochInput.value = 1;
            epochInput.focus();
            return;
          }

          document.getElementById("time").value =
            processedData.peakBaseTimes[epochInput.value - 1];
        });

        // 🔹 检测完成，显示“放电检测成功”
        showToastById("toast2", "放电检测成功 ✅", 1000); // 自动淡出
      } catch (err) {
        console.error(err);
        showToastById("toast2", "放电检测失败 ❌", 1000);
      }
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

  document.getElementById("remove2").addEventListener("click", async () => {
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

  //----------------------------Save功能-----------------------------------------------------
  document.getElementById("savePanel1").addEventListener("click", () => {
    saveCanvasWithTimestamp("panel1Canvas", "Original_Peaks", "white");
  });
  document.getElementById("savePanel3").addEventListener("click", () => {
    saveCanvasWithTimestamp("canvas1", "Original_Peak_Enlargement", "white");
  });
  document.getElementById("savePanel2").addEventListener("click", () => {
    saveSVGWithFormat("panel2SVG", "Heatmap", "white");
  });
  document.getElementById("savePanel4").addEventListener("click", () => {
    saveCanvasWithTimestamp("canvas2", "Filtering Signal", "white");
  });

  //------------------------------------面板放大与还原逻辑------------------------------------

  const panels = document.querySelectorAll("main .grid > div");
  const mainGrid = document.querySelector("main .grid");

  panels.forEach((panel, index) => {
    const expandBtn = panel.querySelector(`#expandPanel${index + 1}`);
    const icon = expandBtn.querySelector("i");
    const contentWrapper = panel.querySelector("canvas, svg")?.parentElement; // 父容器

    expandBtn.addEventListener("click", () => {
      const isExpanded = panel.classList.contains("expanded");

      if (!isExpanded) {
        // 🌟 放大状态
        panels.forEach((p) => {
          if (p !== panel) p.style.display = "none";
        });
        panel.classList.add("expanded");
        mainGrid.classList.add("single-panel-mode");
        icon.classList.replace("fa-expand", "fa-compress");

        // 父容器高度适应 main
        if (contentWrapper) {
          contentWrapper.style.height = "90%";
        }
      } else {
        // 🔙 缩小状态
        panels.forEach((p) => (p.style.display = "block"));
        panel.classList.remove("expanded");
        mainGrid.classList.remove("single-panel-mode");
        icon.classList.replace("fa-compress", "fa-expand");

        // 恢复原高度
        if (contentWrapper) {
          contentWrapper.style.height = ""; // 清空，恢复 h-[350px]
        }
      }

      // 根据 index 处理内容

      // 重新绘制 canvas 或更新 SVG
      switch (index) {
        case 0:
          // requestAnimationFrame(() => requestAnimationFrame(drawGridOnPanel1));
          // if (
          //   document.getElementById("panel1Canvas").dataset.hasContent ===
          //   "true"
          // ) {
          //   requestAnimationFrame(() =>
          //     requestAnimationFrame(() => plotWaveformsOnGrid(processedData))
          //   );
          // }
          break;
        case 1:
          // // SVG 调整宽高自适应
          // requestAnimationFrame(() => requestAnimationFrame(drawGridOnPanel2));

          // // 获取 heatmapLayer
          // const heatmapLayer = document.querySelector(
          //   "#panel2SVG #heatmapLayer"
          // );
          // // 判断 heatmapLayer 是否有实际尺寸
          // if (
          //   heatmapLayer &&
          //   (heatmapLayer.getBBox().width > 0 ||
          //     heatmapLayer.getBBox().height > 0)
          // ) {
          //   // 如果有尺寸，延迟执行 drawSmoothHeatmapTransparentCorners 保证布局完成
          //   requestAnimationFrame(() =>
          //     requestAnimationFrame(() =>
          //       drawSmoothHeatmapTransparentCorners(HeatMapData, "color1")
          //     )
          //   );
          // }

          // // 获取 arrowsLayer
          // const arrowsLayer = document.querySelector("#panel2SVG #arrowsLayer");
          // // 判断 arrowsLayer 是否有实际尺寸
          // if (
          //   arrowsLayer &&
          //   (arrowsLayer.getBBox().width > 0 ||
          //     arrowsLayer.getBBox().height > 0)
          // ) {
          //   // 如果有尺寸，延迟执行 drawArrow 保证布局完成
          //   requestAnimationFrame(() =>
          //     requestAnimationFrame(() => drawArrow(HeatMapData, 2))
          //   );
          // }
          break;
        case 2:
          // 当表达式 === 值1 时执行的代码
          break;
        case 3:
          // 当表达式 === 值2 时执行的代码
          break;
        default:
        // 如果都没有匹配，执行这里的代码
      }
    });
  });

  //------------------------------------删除按键---------------------------------------------
  // 1️⃣ Panel1：重新绘制网格
  document.getElementById("refreshPanel1").addEventListener("click", () => {
    drawGridOnPanel1();
    document.getElementById("panel1Canvas").dataset.hasContent = "false";
  });

  // 2️⃣ Panel2：清空 heatmapLayer 和 arrowsLayer 内容
  document.getElementById("refreshPanel2").addEventListener("click", () => {
    const heatmapLayer = document.getElementById("heatmapLayer");
    const arrowsLayer = document.getElementById("arrowsLayer");
    if (heatmapLayer) heatmapLayer.innerHTML = "";
    if (arrowsLayer) arrowsLayer.innerHTML = "";
    drawGridOnPanel2();
  });

  // 3️⃣ Panel3：清空 canvas1 内容
  document.getElementById("refreshPanel3").addEventListener("click", () => {
    const canvas1 = document.getElementById("canvas1");
    if (canvas1) {
      const ctx = canvas1.getContext("2d");
      ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    }
    canvas1.dataset.hasContent = "false";
  });

  // 4️⃣ Panel4：清空 canvas2 内容
  document.getElementById("refreshPanel4").addEventListener("click", () => {
    const canvas2 = document.getElementById("canvas2");
    if (canvas2) {
      const ctx = canvas2.getContext("2d");
      ctx.clearRect(0, 0, canvas2.width, canvas2.height);
    }
    canvas2.dataset.hasContent = "false";
  });
});
