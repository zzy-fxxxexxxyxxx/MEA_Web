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

// 默认显示第一个 Tab
document.getElementsByClassName("tablinks")[0].click();
