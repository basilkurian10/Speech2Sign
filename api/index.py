from flask import Flask, jsonify, request, current_app
from dotenv import load_dotenv
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
import requests
import time
import re
import nltk
import unicodedata
import spacy
from transformers import pipeline
import nltk
from nltk.tokenize import word_tokenize
import json

nltk.download('punkt')

# Load your fastText model and paraphrase model
# fasttest_model = fasttext.load_model('cc.en.300.bin')
# paraphraser = pipeline("text2text-generation", model="Vamsi/T5_Paraphrase_Paws")
paraphraser = pipeline("text2text-generation", model="facebook/bart-large")



# Load the spaCy model
nlp = spacy.load("en_core_web_sm")

data_store = {}



# Ensure the uploads directory exists
upload_folder = 'uploads'  # Changed to a relative path for better portability
if not os.path.exists(upload_folder):
    os.makedirs(upload_folder)

load_dotenv()  # Load environment variables from .env file
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/api/audio", methods=['POST'])
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
    data = request.get_json()
    received_string = data.get('string', '')
    print("Received string:", received_string)
    
    preprocessed_text=  preprocessText(received_string)
    print("preprocessed_text",preprocessed_text)
    entities=  extract_entities_spacy(preprocessed_text)
    print("entities",entities)
    # Open the JSON file
    with open('data.json', 'r') as file:
    # Load the data from the file
        corpus = json.load(file)
    print(corpus)
    
    list=[]
    words = word_tokenize(preprocessed_text)
    print("words",words)
    list=modify_words(words,corpus)
    
    # for i in words:
    #     alternative_word = find_alternative_word(i, corpus)
    #     if(alternative_word):
    #         print("alternative_word",alternative_word)
    #         list.append(alternative_word)
    #     else:
    #         list.append([character.lower() for character in i])               
    print("list",list)
    data_store["word_data"] = list

    # model= load_model('my_model25.keras')
    if(list):
         return jsonify(list), 200
    else: 
        return jsonify({'error': 'No data '}), 500

def preprocessText(text):
    # Remove accented characters
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    
    # Lowercase the text
    text = text.lower()
    
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    
    # Remove special characters
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    # Remove emojis
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    return text

def extract_entities_spacy(text):
    # Process the text
    doc = nlp(text)
    
    # Extract entities
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    print("Extracted Entities:", entities)
    
    # Filter for specific entity types
    filtered_entities = [
        (ent.text, ent.label_) 
        for ent in doc.ents 
        if ent.label_ in ['PERSON', 'GPE', 'LOC']
    ]
    
    return filtered_entities


def createCorpus():
    print("Current working directory:", os.getcwd())

    filenames = []
    for filename in os.listdir('renamed_videos'):
        full_path = os.path.join('renamed_videos', filename)
        if os.path.isfile(full_path):
            file_name_without_ext = os.path.splitext(filename)[0]
            filenames.append(file_name_without_ext)
            
    with open('data.json', 'w') as json_file:
        json.dump(filenames, json_file, indent=4)
    return filenames


def modify_words(words,corpus): #modifies words so all of them are in the dictionary 
    modified_words = []
    for word in words:
        if word in corpus:
            modified_words.append(word)
        else:
            # that means word is not available, resort to char sequence
            modified_words.append([character.lower() for character in word])
    return modified_words

def is_word_in_corpus(word, corpus):
    return word in corpus

def is_word_in_model(word, model):
    return model.get_word_vector(word).any()

def paraphrase(word):
    result = paraphraser(f"Paraphrase: {word}", max_length=50)
    print(result)
    return result[0]['generated_text']

def find_alternative_word(word, corpus):
    if is_word_in_corpus(word, corpus):
        return word
    else:
        paraphrased_word = paraphrase(word)
        if is_word_in_corpus(paraphrased_word, corpus):
            return paraphrased_word
        else:
            return None
            

@app.route('/api/word_data', methods=['GET'])
def retrieve_data():
    value = data_store.get("word_data")
    if value is not None:
        return jsonify({"value": value}), 200
    return jsonify({"error": "Data not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)
