# MEA.py
from flask import Flask, render_template, request, jsonify
import os
import tempfile
import numpy as np
import neurokit2 as nk

app = Flask(__name__)





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



# # 启动 Flask
# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # $PORT 来自 Render，5000 仅作本地测试
    app.run(host="0.0.0.0", port=port, debug=True)