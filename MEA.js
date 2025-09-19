function openTab(evt, tabName) {
  // 隐藏所有左侧内容
  const tabcontents = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontents.length; i++) {
    tabcontents[i].style.display = "none";
  }

  // 移除所有按钮 active 样式
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // 显示当前 tab 内容
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// 等页面加载完成再执行下面的逻辑
document.addEventListener("DOMContentLoaded", () => {
  // 默认显示第一个 Tab
  const firstTab = document.getElementsByClassName("tablinks")[0];
  if (firstTab) {
    firstTab.click();
  }

  // 定义画坐标轴函数
  function drawAxes(canvasId) {
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

  // 画 panel3 和 panel4 的坐标系
  drawAxes("chart1");
  drawAxes("chart2");

  // h5 文件读取功能
  const submitBtn = document.getElementById("submitBtn");
  const fileInput = document.getElementById("fileInput");

  if (submitBtn && fileInput) {
    // 点击提交按钮 → 打开文件选择框
    submitBtn.addEventListener("click", () => {
      fileInput.click();
    });

    // 选择文件后 → 显示提示
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        alert("读取成功: " + fileInput.files[0].name);
      }
    });
  }
});
