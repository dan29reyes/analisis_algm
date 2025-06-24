from flask import Flask, request, jsonify
from flask_cors import CORS 
import subprocess
import json
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
C_EXECUTABLE_PATHFINDER = os.path.join(BASE_DIR, 'pages', 'api', 'algorithms', 'path_finder')
C_EXECUTABLE_COMMUNITY_PATH_FINDER = os.path.join(BASE_DIR, 'pages', 'api', 'algorithms', 'community_path_finder')

# Add path for subset_sum executable
SUBSET_SUM_PATH = os.path.join(BASE_DIR, 'pages', 'api', 'algorithms', 'subset_sum')
# On Windows, you might need to add .exe
if os.name == 'nt' and not os.path.exists(SUBSET_SUM_PATH):
    SUBSET_SUM_PATH += '.exe'

@app.route('/find-paths', methods=['GET'])
def find_paths_api():
    try:
        method = request.args.get('method', type=str, default='pathfinder').lower()
        num_vertices = request.args.get('vertices', type=int)
        start_node = request.args.get('start', type=int, default=0)

        if num_vertices is None:
            return jsonify({"status": "error", "message": "Missing 'vertices' parameter"}), 400
        if method not in ['pathfinder', 'community_path_finder']:
            return jsonify({"status": "error", "message": f"Invalid method '{method}'. Use 'pathfinder' or 'community_path_finder'."}), 400
        
        command = []
        if method == 'community_path_finder':
            command = [C_EXECUTABLE_COMMUNITY_PATH_FINDER, str(num_vertices), str(start_node)]
        elif method == 'pathfinder':
            command = [C_EXECUTABLE_PATHFINDER, str(num_vertices), str(start_node)]
            
        print(f"DEBUG: Executing C command: {command}")
        
        process = subprocess.run(command, capture_output=True, text=True, check=True)

        print(f"DEBUG: C program STDOUT:\n{process.stdout}")
        print(f"DEBUG: C program STDERR:\n{process.stderr}")

        try:
            c_output_json = json.loads(process.stdout)
            return jsonify(c_output_json), 200
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

@app.route('/subset-sum', methods=['POST'])
def subset_sum():
    try:
        # Get data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        numbers = data.get('numbers', [])
        target = data.get('target', 0)
        algorithm = data.get('algorithm', 1)
        
        # Validate input
        if not numbers:
            return jsonify({
                "status": "error",
                "message": "No numbers provided"
            }), 400
        
        if target < 0:
            return jsonify({
                "status": "error",
                "message": "Target must be non-negative"
            }), 400
        
        # Convert numbers to strings for command line
        numbers_str = [str(num) for num in numbers]
        
        # Check if the C program exists
        if not os.path.exists(SUBSET_SUM_PATH):
            return jsonify({
                "status": "error",
                "message": f"Subset sum executable not found at {SUBSET_SUM_PATH}. Please compile subset_sum.c first."
            }), 500
        
        # Build command: ./subset_sum <target> <algorithm_type> <number1> <number2> ...
        cmd = [SUBSET_SUM_PATH, str(target), str(algorithm)] + numbers_str
        
        print(f"DEBUG: Executing subset sum command: {cmd}")
        
        # Run the C program
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1000
            )
            
            print(f"DEBUG: Subset sum STDOUT:\n{result.stdout}")
            print(f"DEBUG: Subset sum STDERR:\n{result.stderr}")
            
            if result.returncode != 0:
                return jsonify({
                    "status": "error",
                    "message": f"C program error: {result.stderr}"
                }), 500
            
            # Parse the JSON output from the C program
            try:
                output = json.loads(result.stdout)
                return jsonify(output), 200
            except json.JSONDecodeError:
                return jsonify({
                    "status": "error",
                    "message": "Invalid JSON output from C program",
                    "output": result.stdout
                }), 500
                
        except subprocess.TimeoutExpired:
            return jsonify({
                "status": "error",
                "message": "Calculation timeout - input too complex"
            }), 500
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Subprocess error: {str(e)}"
            }), 500
            
    except Exception as e:
        print(f"ERROR: An unexpected server error occurred in Flask: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Algorithms API",
        "endpoints": {
            "/health": "GET - Health check",
            "/find-paths": "GET - Find paths algorithm",
            "/subset-sum": "POST - Calculate subset sum"
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)