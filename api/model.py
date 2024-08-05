from flask import Flask, jsonify, request, current_app
from dotenv import load_dotenv
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
import requests
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/api/python", methods=['POST'])
def translate():
    print(request.files)  # Debugging: Print the files part of the request
    if 'audioFile' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['audioFile']
    print(file.filename)  # Debugging: Print the filename

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_folder, filename)
    
    # Save the file to the uploads directory
    try:
        file.save(file_path)
    except Exception as e:
        print(f"Error saving file: {e}")  # Debugging: Print the error message
        return jsonify({'error': 'Failed to save file'}), 500

    # Process the file (for example, save it to disk or read its content)
    API_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
    headers = {"Authorization": "Bearer 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"}

    data = None
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            data = f.read()
    
    if data:
        with app.app_context():
            response = requests.post(API_URL, headers=headers, data=data)
            print(response.json())

        if response.status_code == 503:
            estimated_time = response.json().get('estimated_time', 0)
            print(f"Model is currently loading. Waiting for {estimated_time} seconds...")
            time.sleep(estimated_time)
            response = requests.post(API_URL, headers=headers, data=data)
    
        return jsonify(response.json())

    return jsonify({'error': 'No data to process'}), 500

@app.route("/api/sign", methods=['POST'])
def texttoSign():
    return "hello"


if __name__ == "__main__":
    app.run(debug=True)
