# MEA.py
from flask import Flask, render_template, request, jsonify
import os
import tempfile
import numpy as np
import matlab.engine

app = Flask(__name__)


# 启动 MATLAB 引擎
print("正在启动 MATLAB 引擎...")
eng = matlab.engine.start_matlab()
eng.addpath(
    r"D:/lesson/lyx_gc/web_make/matlab_code", nargout=0
)  # nargout表示返回值个数
print("MATLAB 引擎启动完成。")


# 首页路由
@app.route("/")
def index():
    return render_template("MEA.html")  # 前端 HTML 文件


# # 插值 API 路由
# @app.route("/inpaint", methods=["POST"])
# def inpaint_route():
#     try:
#         payload = request.json
#         data = payload.get("matrix")  # 前端传来的二维数组
#         method = payload.get("method", 0)  # 默认 method 0

#         if data is None:
#             return jsonify({"error": "No matrix provided"}), 400

#         # 转换为 MATLAB double
#         mat_data = matlab.double(data)

#         # 调用 MATLAB inpaint_nans，method 0 默认
#         result = eng.inpaint_nans(mat_data, method, nargout=1)

#         # 转回 Python list
#         result_list = np.array(result).tolist()

#         return jsonify({"result": result_list})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500




# =======================
# 启动 Flask
# =======================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
