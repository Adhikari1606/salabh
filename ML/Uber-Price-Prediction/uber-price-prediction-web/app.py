from flask import Flask, render_template, request
import pandas as pd
import pickle
from math import radians, sin, cos, sqrt, atan2

app = Flask(__name__)

# Load the trained model
def load_model():
    with open('svr_model.pkl', 'rb') as file:
        model = pickle.load(file)
    return model

model = load_model()

# Function to calculate distance between coordinates using Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance_km = 6371 * c  # Radius of the Earth in kilometers
    return distance_km

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    pickup_longitude = float(request.form['pickup_longitude'])
    pickup_latitude = float(request.form['pickup_latitude'])
    dropoff_longitude = float(request.form['dropoff_longitude'])
    dropoff_latitude = float(request.form['dropoff_latitude'])
    passenger_count = int(request.form['passenger_count'])

    # Calculate distance
    distance_km = calculate_distance(pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude)

    # Prepare input data for prediction
    input_data = pd.DataFrame({
        'pickup_longitude': [pickup_longitude],
        'pickup_latitude': [pickup_latitude],
        'dropoff_longitude': [dropoff_longitude],
        'dropoff_latitude': [dropoff_latitude],
        'passenger_count': [passenger_count],
        'distance_km': [distance_km]
    })

    # Make prediction
    prediction = model.predict(input_data)

    return render_template('index.html', prediction=prediction[0])

if __name__ == '__main__':
    app.run(debug=True)