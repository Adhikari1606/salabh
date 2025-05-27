import math
from flask import Flask, jsonify, render_template, request
import pandas as pd
import pickle
from math import radians, sin, cos, sqrt, atan2
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the trained model
def load_model():
    try:
        with open('svr_model.pkl', 'rb') as file:
            model = pickle.load(file)
        return model
    except FileNotFoundError:
        logger.error("Model file 'svr_model.pkl' not found")
        return None
    except pickle.UnpicklingError as e:
        logger.error(f"Error unpickling model: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading model: {e}")
        return None

# Input validation function
def validate_coordinates(lat, lon):
    return -90 <= lat <= 90 and -180 <= lon <= 180

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate the distance between two points on the Earth
    R = 6371  # Radius of the Earth in kilometers
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Input validation
        required_fields = ['pickup_longitude', 'pickup_latitude', 
                           'dropoff_longitude', 'dropoff_latitude', 
                           'passenger_count']
        if not all(k in request.form for k in required_fields):
            logger.error("Missing required fields")
            return jsonify({'error': 'Missing required fields'}), 400

        pickup_longitude = float(request.form['pickup_longitude'])
        pickup_latitude = float(request.form['pickup_latitude'])
        dropoff_longitude = float(request.form['dropoff_longitude'])
        dropoff_latitude = float(request.form['dropoff_latitude'])
        passenger_count = int(request.form['passenger_count'])

        # Validate coordinates
        if not all(validate_coordinates(lat, lon) for lat, lon in [
            (pickup_latitude, pickup_longitude),
            (dropoff_latitude, dropoff_longitude)
        ]):
            logger.error("Invalid coordinates")
            return jsonify({'error': 'Invalid coordinates'}), 400

        # Validate passenger count
        if not (1 <= passenger_count <= 8):
            logger.error("Invalid passenger count")
            return jsonify({'error': 'Invalid passenger count'}), 400

        # Calculate distance
        distance_km = calculate_distance(pickup_latitude, pickup_longitude, 
                                         dropoff_latitude, dropoff_longitude)

        # Prepare input data for prediction
        input_data = pd.DataFrame({
            'distance': [distance_km],
            'duration': [0],  # Placeholder for duration
            'time_of_day': [0]  # Placeholder for time_of_day
        })

        if model is None:
            logger.error("Model not loaded")
            return jsonify({'error': 'Model not loaded'}), 500

        prediction = model.predict(input_data)[0]
        return jsonify({'prediction': float(prediction)})

    except ValueError as e:
        logger.error(f"ValueError: {e}")
        return jsonify({'error': 'Invalid input format'}), 400
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    model = load_model()
    if model is None:
        raise RuntimeError("Failed to load the model. Please check the 'svr_model.pkl' file.")
    app.run(debug=False)  # Set debug=False in productionimport math
from flask import Flask, jsonify, render_template, request
import pandas as pd
import random  # For generating random predictions
from math import radians, sin, cos, sqrt, atan2
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Input validation function
def validate_coordinates(lat, lon):
    return -90 <= lat <= 90 and -180 <= lon <= 180

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate the distance between two points on the Earth
    R = 6371  # Radius of the Earth in kilometers
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Input validation
        required_fields = ['pickup_longitude', 'pickup_latitude', 
                           'dropoff_longitude', 'dropoff_latitude', 
                           'passenger_count']
        if not all(k in request.form for k in required_fields):
            logger.error("Missing required fields")
            return jsonify({'error': 'Missing required fields'}), 400

        pickup_longitude = float(request.form['pickup_longitude'])
        pickup_latitude = float(request.form['pickup_latitude'])
        dropoff_longitude = float(request.form['dropoff_longitude'])
        dropoff_latitude = float(request.form['dropoff_latitude'])
        passenger_count = int(request.form['passenger_count'])

        # Validate coordinates
        if not all(validate_coordinates(lat, lon) for lat, lon in [
            (pickup_latitude, pickup_longitude),
            (dropoff_latitude, dropoff_longitude)
        ]):
            logger.error("Invalid coordinates")
            return jsonify({'error': 'Invalid coordinates'}), 400

        # Validate passenger count
        if not (1 <= passenger_count <= 8):
            logger.error("Invalid passenger count")
            return jsonify({'error': 'Invalid passenger count'}), 400

        # Calculate distance
        distance_km = calculate_distance(pickup_latitude, pickup_longitude, 
                                         dropoff_latitude, dropoff_longitude)

        # Prepare input data for prediction (for testing purposes, we won't use this)
        input_data = pd.DataFrame({
            'distance': [distance_km],
            'duration': [0],  # Placeholder for duration
            'time_of_day': [0]  # Placeholder for time_of_day
        })

        # Generate a random prediction for testing purposes
        random_prediction = round(random.uniform(5, 50), 2)  # Random fare between 5 and 50
        logger.info(f"Random prediction generated: {random_prediction}")
        return jsonify({'prediction': random_prediction})

    except ValueError as e:
        logger.error(f"ValueError: {e}")
        return jsonify({'error': 'Invalid input format'}), 400
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=False)  # Set debug=False in production