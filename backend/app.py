from flask import Flask, request, jsonify, send_from_directory
import joblib
import numpy as np
import os
import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase
try:
    cred = credentials.Certificate("firebase-key.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'YOUR_DATABASE_URL'
    })
    firebase_enabled = True
except Exception as e:
    print("Firebase not configured:", e)
    firebase_enabled = False

app = Flask(__name__)

# Load model
model_path = os.path.join(os.path.dirname(__file__), '../breath_model.pkl')
model = joblib.load(model_path)

@app.route('/')
def home():
    return send_from_directory('../frontend', 'index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    features = [
        data['mq3'],
        data['mq135'],
        data['mq138'],
        data['temp'],
        data['humidity'],
        data['pressure'],
        data['spo2'],
        data['hr']
    ]
    
    prediction = model.predict([features])[0]
    
    # Save to Firebase if enabled
    if firebase_enabled:
        ref = db.reference('predictions')
        ref.push({
            'features': features,
            'prediction': prediction,
            'timestamp': {'.sv': 'timestamp'}
        })
    
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)