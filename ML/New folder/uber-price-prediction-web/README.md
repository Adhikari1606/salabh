# Uber Price Prediction Web Application

## Overview
This project is a web application that predicts Uber ride prices using a machine learning model. Users can input their ride details, such as pickup and dropoff locations, passenger count, and the application will provide an estimated fare based on the trained model.

## Project Structure
```
uber-price-prediction-web/
├── templates/
│   └── index.html          # HTML structure for the web page
├── static/
│   ├── css/
│   │   └── style.css       # CSS styles for the web page
│   └── js/
│       └── script.js       # JavaScript for handling user interactions
├── app.py                  # Main application file
├── svr_model.pkl           # Trained machine learning model
├── uber_data.csv           # Dataset used for training the model
├── requirements.txt         # Python dependencies
└── README.md               # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd uber-price-prediction-web
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python app.py
   ```

4. Open your web browser and go to `http://127.0.0.1:5000` to access the application.

## Usage
- Enter the pickup and dropoff coordinates, passenger count, and any other required details in the provided form.
- Click the "Predict Fare" button to get the estimated fare for your ride.
- The predicted fare will be displayed on the web page.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.