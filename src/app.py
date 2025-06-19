from flask import Flask, request, jsonify
from flask_cors import CORS 
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
C_EXECUTABLE_PATH = os.path.join(BASE_DIR, 'pages', 'api', 'algorithms', 'path_finder.exe')
C_GRAPH_COLORING_PATH = os.path.join(BASE_DIR, 'pages', 'api', 'algorithms', 'Graph_Coloring_Comunidad.exe')

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

@app.route('/graph-coloring', methods=['POST'])
def graph_coloring_api():
    try:
        data = request.get_json()
        if not data or 'graph' not in data or 'sudoku' not in data:
            return jsonify({"status": "error", "message": "Missing 'graph' or 'sudoku' in request body"}), 400

        graph = data['graph']
        sudoku = data['sudoku']

        if len(graph) != 81 or any(len(row) != 81 for row in graph):
            return jsonify({"status": "error", "message": "Graph must be 81x81."}), 400
        if len(sudoku) != 81:
            return jsonify({"status": "error", "message": "Sudoku must contain 81 values."}), 400
        sudoku_line = ' '.join(map(str, sudoku)) + '\n'
        graph_lines = '\n'.join(' '.join(map(str, row)) for row in graph) + '\n'
        input_data = sudoku_line + graph_lines

        command = [C_GRAPH_COLORING_PATH]
        print(f"DEBUG: Executing C GraphColoring command: {command}")
        process = subprocess.run(command, input=input_data, capture_output=True, text=True, check=True)
        print(f"DEBUG: C GraphColoring STDOUT:\n{process.stdout}")
        print(f"DEBUG: C GraphColoring STDERR:\n{process.stderr}")
        return jsonify({
            "output": process.stdout,
            "stderr": process.stderr
        }), 200
    except subprocess.CalledProcessError as e:
        print(f"ERROR: C GraphColoring exited with non-zero status ({e.returncode})")
        return jsonify({
            "status": "error",
            "message": "C GraphColoring execution failed.",
            "c_stdout": e.stdout,
            "c_stderr": e.stderr,
            "return_code": e.returncode
        }), 500
    except Exception as e:
        print(f"ERROR: Unexpected error in /graph-coloring: {str(e)}")
        return jsonify({"status": "error", "message": f"Unexpected server error: {str(e)}"}), 500
    
@app.route('/graph-coloring-propio', methods=['POST'])
def graph_coloring_propio_api():
    try:
        data = request.get_json()
        if not data or 'graph' not in data or 'sudoku' not in data:
            return jsonify({"status": "error", "message": "Missing 'graph' or 'sudoku' in request body"}), 400

        graph = data['graph']
        sudoku = data['sudoku']

        if len(graph) != 81 or any(len(row) != 81 for row in graph):
            return jsonify({"status": "error", "message": "Graph must be 81x81."}), 400
        if len(sudoku) != 81:
            return jsonify({"status": "error", "message": "Sudoku must contain 81 values."}), 400
        sudoku_line = ' '.join(map(str, sudoku)) + '\n'
        graph_lines = '\n'.join(' '.join(map(str, row)) for row in graph) + '\n'
        input_data = sudoku_line + graph_lines

        command = [C_GRAPH_COLORING_PATH]
        print(f"DEBUG: Executing C GraphColoring command: {command}")
        process = subprocess.run(command, input=input_data, capture_output=True, text=True, check=True)
        print(f"DEBUG: C GraphColoring STDOUT:\n{process.stdout}")
        print(f"DEBUG: C GraphColoring STDERR:\n{process.stderr}")
        return jsonify({
            "output": process.stdout,
            "stderr": process.stderr
        }), 200
    except subprocess.CalledProcessError as e:
        print(f"ERROR: C GraphColoring exited with non-zero status ({e.returncode})")
        return jsonify({
            "status": "error",
            "message": "C GraphColoring execution failed.",
            "c_stdout": e.stdout,
            "c_stderr": e.stderr,
            "return_code": e.returncode
        }), 500
    except Exception as e:
        print(f"ERROR: Unexpected error in /graph-coloring: {str(e)}")
        return jsonify({"status": "error", "message": f"Unexpected server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)