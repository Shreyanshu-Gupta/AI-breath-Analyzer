# ====== IMPORTS ======
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import os

# ====== APP SETUP ======
app = Flask(__name__)
CORS(app)  # Allow all origins (fine for local dev)

# ====== LOAD MODEL ======
# The model was trained on string labels: healthy, fever, smoker, alcohol
model_path = os.path.join(os.path.dirname(__file__), '../breath_model.pkl')
model = joblib.load(model_path)

# Human-readable label descriptions
LABEL_DESCRIPTIONS = {
    'healthy': 'No significant health anomalies detected.',
    'fever':   'Elevated temperature biomarkers detected.',
    'smoker':  'Smoker-pattern VOC profile identified.',
    'alcohol': 'Alcohol metabolite presence detected.',
}

# ====== ROUTES ======

@app.route('/')
def home():
    return send_from_directory('../frontend', 'index.html')

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    if not data:
        return jsonify({'error': 'No JSON body received'}), 400

    # Extract features in the order the model was trained on
    # Training CSV columns: mq3, mq135, mq138, temp, humidity, pressure, spo2, hr
    try:
        features = [
            float(data.get('mq3',      0)),
            float(data.get('mq135',    0)),
            float(data.get('mq138',    0)),
            float(data.get('temp',     0)),
            float(data.get('humidity', 0)),
            float(data.get('pressure', 0)),
            float(data.get('spo2',     0)),
            float(data.get('hr',       0)),
        ]
    except (TypeError, ValueError) as e:
        return jsonify({'error': f'Invalid feature values: {e}'}), 400

    # Model returns a string label (e.g. 'healthy', 'fever', 'smoker', 'alcohol')
    prediction = model.predict([features])[0]
    label = str(prediction)

    return jsonify({
        'prediction':      label,
        'prediction_text': LABEL_DESCRIPTIONS.get(label, label),
        'status':          'success',
    })

@app.route('/history', methods=['GET'])
def history():
    # Placeholder — extend with DB integration later
    return jsonify({
        'success': True,
        'history': [],
    })

# ====== RUN SERVER ======
if __name__ == '__main__':
    app.run(debug=True)