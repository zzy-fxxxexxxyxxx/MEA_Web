# MEA.py
from flask import Flask, render_template, request, jsonify
import os
import tempfile
import numpy as np
import neurokit2 as nk

app = Flask(__name__)


# # 启动 MATLAB 引擎
# print("正在启动 MATLAB 引擎...")
# eng = matlab.engine.start_matlab()
# eng.addpath(
#     r"D:/lesson/lyx_gc/web_make/matlab_code", nargout=0
# )  # nargout表示返回值个数
# print("MATLAB 引擎启动完成。")


# 首页路由
@app.route("/")
def index():
    return render_template("MEA.html")  # 前端 HTML 文件



@app.route("/process_signal", methods=["POST"])
def process_signal():
    try:
        # 获取前端数据
        data = request.json
        signal = np.array(data.get("signal"), dtype=float)
        fs = int(float(data.get("fs", 0)))

        # 调用 NeuroKit2 处理信号
        clean = nk.ecg_clean(signal, sampling_rate=fs, method="vg")
        _, rpeaks_dict = nk.ecg_peaks(clean, sampling_rate=fs, method="vg")
        rpeaks = rpeaks_dict["ECG_R_Peaks"].astype(float)

        return jsonify({
            "clean": clean.tolist(),
            "rpeaks": rpeaks.tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# 启动 Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
