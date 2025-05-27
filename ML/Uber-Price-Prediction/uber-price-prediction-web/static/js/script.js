// filepath: uber-price-prediction-web/static/js/script.js

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('fare-prediction-form');
    const resultSection = document.getElementById('prediction-result');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const data = {
            pickup_longitude: formData.get('pickup_longitude'),
            pickup_latitude: formData.get('pickup_latitude'),
            dropoff_longitude: formData.get('dropoff_longitude'),
            dropoff_latitude: formData.get('dropoff_latitude'),
            passenger_count: formData.get('passenger_count')
        };

        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            resultSection.innerHTML = `Predicted Fare Amount: $${data.predicted_fare.toFixed(2)}`;
        })
        .catch(error => {
            console.error('Error:', error);
            resultSection.innerHTML = 'Error predicting fare. Please try again.';
        });
    });
});