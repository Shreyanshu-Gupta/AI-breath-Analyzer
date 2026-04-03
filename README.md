# BreathAI Project

A machine learning-based health monitoring system that analyzes breath data to predict health conditions.

## Project Structure

- `backend/`: Flask API server
- `frontend/`: Web dashboard
- `model/`: Machine learning model training and saved model
- `data/`: Dataset for training

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   ```

2. Install dependencies:
   ```
   pip install pandas numpy scikit-learn flask firebase-admin
   ```

3. Train the model:
   ```
   cd model
   python train_model.py
   ```

4. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Realtime Database
   - Download the service account key as `firebase-key.json` and place it in the `backend/` folder
   - Update the `databaseURL` in `backend/app.py` with your Firebase database URL

5. Run the backend:
   ```
   cd backend
   python app.py
   ```

6. Open the frontend:
   - Open `frontend/index.html` in a web browser
   - Enter sensor data and submit to get predictions

## API Endpoints

- `GET /`: Home page
- `POST /predict`: Predict health condition from sensor data

## Features

- Predicts health conditions: alcohol, fever, healthy, high_voc, smoker
- Stores predictions in Firebase Realtime Database
- Web interface for inputting sensor data</content>
<parameter name="filePath">c:\Users\Admin\Downloads\BreathAI_Project\README.md