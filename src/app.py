from flask import Flask, request, jsonify
from flask_cors import CORS 
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
C_EXECUTABLE_PATH = os.path.join(BASE_DIR, 'pages', 'api', 'algorithms', 'path_finder')

@app.route('/find-paths', methods=['GET'])
def find_paths_api():
    try:
        num_vertices = request.args.get('vertices', type=int)
        start_node = request.args.get('start', type=int, default=0)

        if num_vertices is None:
            return jsonify({"status": "error", "message": "Missing 'vertices' parameter"}), 400

        if not (1 <= num_vertices <= 15):
            return jsonify({"status": "error", "message": f"Number of vertices must be between 1 and 10."}), 400

        command = [C_EXECUTABLE_PATH, str(num_vertices), str(start_node)]
        print(f"DEBUG: Executing C command: {command}")
        
        process = subprocess.run(command, capture_output=True, text=True, check=True)

        print(f"DEBUG: C program STDOUT:\n{process.stdout}")
        print(f"DEBUG: C program STDERR:\n{process.stderr}")

        try:
            c_output_json = json.loads(process.stdout)
            return jsonify(c_output_json), 200
            # return jsonify(process.stdout), 200
        except json.JSONDecodeError as e:
            print(f"ERROR: JSON parsing failed for C output: {e}")
            return jsonify({"status": "error", "message": "Failed to parse JSON output from C program. Check C program's output format or if it crashed.", "c_raw_output": process.stdout, "c_stderr": process.stderr}), 500

    except subprocess.CalledProcessError as e:
        print(f"ERROR: C program exited with non-zero status ({e.returncode}).")
        print(f"C Program STDOUT on error:\n{e.stdout}")
        print(f"C Program STDERR on error:\n{e.stderr}")
        try:
            error_details = json.loads(e.stdout)
            return jsonify(error_details), 500
        except json.JSONDecodeError:
            return jsonify({
                "status": "error",
                "message": "C program execution failed and did not return valid JSON error.",
                "c_stdout": e.stdout,
                "c_stderr": e.stderr,
                "return_code": e.returncode
            }), 500
    except Exception as e:
        print(f"ERROR: An unexpected server error occurred in Flask: {str(e)}")
        return jsonify({"status": "error", "message": f"An unexpected server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)