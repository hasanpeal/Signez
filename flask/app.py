import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import base64

app = Flask(__name__)
CORS(app)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, min_detection_confidence=0.3, min_tracking_confidence=0.5)

# Load the trained model
with open('model.p', 'rb') as f:
    model_dict = pickle.load(f)
model = model_dict['model']

# Create a dictionary to map the labels
with open('data.pickle', 'rb') as f:
    labels = sorted(set(pickle.load(f)['labels']))
labels_dict = {i: label for i, label in enumerate(labels)}

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working'}), 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400

    image_data = np.frombuffer(base64.b64decode(data['image']), dtype=np.uint8)
    image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({'error': 'Failed to decode image'}), 400

    try:
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)
        if results.multi_hand_landmarks:
            data_aux = []
            x_ = []
            y_ = []
            for hand_landmarks in results.multi_hand_landmarks:
                for i in range(len(hand_landmarks.landmark)):
                    x = hand_landmarks.landmark[i].x
                    y = hand_landmarks.landmark[i].y

                    x_.append(x)
                    y_.append(y)

                for i in range(len(hand_landmarks.landmark)):
                    x = hand_landmarks.landmark[i].x
                    y = hand_landmarks.landmark[i].y
                    data_aux.append(x - min(x_))
                    data_aux.append(y - min(y_))

            while len(data_aux) < 42 * 2:
                data_aux.append(0.0)

            prediction = model.predict([np.asarray(data_aux)])
            predicted_character = prediction[0]
            return jsonify({'prediction': predicted_character})

        return jsonify({'error': 'No hand landmarks detected'}), 400

    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500



if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True)