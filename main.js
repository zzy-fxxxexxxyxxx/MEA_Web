import * as h5wasm from "https://cdn.jsdelivr.net/npm/h5wasm@0.7.8/dist/esm/hdf5_hl.js";

import {
  openTab,
  drawAxes,
  data_preprocessing,
  mode,
  readH5File,
} from "./def.js";

//----------------------------------------------------------------------------------------------------

// 等页面加载完成再执行下面的逻辑
document.addEventListener("DOMContentLoaded", async () => {
  // 获取所有按钮和内容
  const tabButtons = document.querySelectorAll(".tablinks");
  const tabContents = document.querySelectorAll(".tabcontent");
  // 给按钮绑定事件
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
  //----------------------------------------------------
  await h5wasm.ready; // 等待 wasm 初始化完成

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

    const h5Data = await readH5File(file);
    console.log(h5Data); // 查看所有层级和 dataset 内容

    function toNumberIfBigInt(value) {
      return typeof value === "bigint" ? Number(value) : value;
    }

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
    document.getElementById("output").textContent += "\n文件读取成功 ✅";

    try {
      const processedData = await data_preprocessing(h5Data);

      console.log("fs:", processedData.fs);
      console.log("Raw_data:", processedData.Raw_data);
      console.log("layout:", processedData.layout);
      console.log("peakArriveTime:", processedData.peakArriveTime);

      document.getElementById("output").textContent += "\n数据处理成功 ✅";
    } catch (err) {
      document.getElementById("output").textContent +=
        "\n❌ 数据处理出错: " + err.message;
    }
  });
});
