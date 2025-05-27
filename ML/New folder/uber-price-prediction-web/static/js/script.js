document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');
    const form = document.getElementById('prediction-form');
    const resultDiv = document.getElementById('prediction-result');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('Form submitted');
        resultDiv.innerHTML = '<div class="loading">Calculating fare...</div>';

        try {
            // Get form values
            const formData = {
                pickup_longitude: parseFloat(form.pickup_longitude.value),
                pickup_latitude: parseFloat(form.pickup_latitude.value),
                dropoff_longitude: parseFloat(form.dropoff_longitude.value),
                dropoff_latitude: parseFloat(form.dropoff_latitude.value),
                passenger_count: parseInt(form.passenger_count.value),
            };
            console.log('Form data:', formData);

            // Validate inputs
            validateInputs(formData);

            // Calculate distance
            const distance_km = calculateDistance(
                formData.pickup_latitude,
                formData.pickup_longitude,
                formData.dropoff_latitude,
                formData.dropoff_longitude
            );
            console.log('Distance (km):', distance_km);

            // Estimate travel time (assuming an average speed of 40 km/h)
            const travelTimeMinutes = (distance_km / 40) * 60;
            console.log('Estimated travel time (minutes):', travelTimeMinutes);

            // Calculate realistic fare
            const realisticFare = calculateRealisticFare(distance_km, travelTimeMinutes);
            console.log('Realistic fare:', realisticFare);

            // Display the prediction result
            resultDiv.innerHTML = `
                <div class="success">
                    <h3>Fare Prediction</h3>
                    <p>Estimated fare: $${realisticFare.toFixed(2)}</p>
                    <p>Distance: ${distance_km.toFixed(2)} km</p>
                    <p>Estimated travel time: ${travelTimeMinutes.toFixed(2)} minutes</p>
                </div>`;
        } catch (error) {
            console.error('Error:', error.message);
            resultDiv.innerHTML = `
                <div class="error">
                    <p>Error: ${error.message}</p>
                    <p>Please check your inputs and try again.</p>
                </div>`;
        }
    });

    function validateInputs(inputs) {
        // Validate coordinates
        if (inputs.pickup_latitude < -90 || inputs.pickup_latitude > 90 || isNaN(inputs.pickup_latitude)) {
            throw new Error('Pickup latitude must be between -90 and 90');
        }
        if (inputs.dropoff_latitude < -90 || inputs.dropoff_latitude > 90 || isNaN(inputs.dropoff_latitude)) {
            throw new Error('Dropoff latitude must be between -90 and 90');
        }
        if (inputs.pickup_longitude < -180 || inputs.pickup_longitude > 180 || isNaN(inputs.pickup_longitude)) {
            throw new Error('Pickup longitude must be between -180 and 180');
        }
        if (inputs.dropoff_longitude < -180 || inputs.dropoff_longitude > 180 || isNaN(inputs.dropoff_longitude)) {
            throw new Error('Dropoff longitude must be between -180 and 180');
        }

        // Validate passenger count
        if (inputs.passenger_count < 1 || inputs.passenger_count > 8 || isNaN(inputs.passenger_count)) {
            throw new Error('Passenger count must be between 1 and 8');
        }

        return true;
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const toRadians = (deg) => (deg * Math.PI) / 180;
        lat1 = toRadians(lat1);
        lon1 = toRadians(lon1);
        lat2 = toRadians(lat2);
        lon2 = toRadians(lon2);

        const dlat = lat2 - lat1;
        const dlon = lon2 - lon1;
        const a =
            Math.sin(dlat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const radiusOfEarthKm = 6371;
        return radiusOfEarthKm * c;
    }

    function calculateRealisticFare(distance, travelTime) {
        const baseFare = 3.0; // Base fare in dollars
        const perKmRate = 1.5; // Rate per kilometer in dollars
        const perMinuteRate = 0.25; // Rate per minute in dollars
        const surgeMultiplier = isPeakHour() ? 1.5 : 1.0; // Surge pricing multiplier

        // Calculate fare
        const fare = (baseFare + distance * perKmRate + travelTime * perMinuteRate) * surgeMultiplier;
        return fare;
    }

    function isPeakHour() {
        const currentHour = new Date().getHours();
        // Define peak hours (e.g., 7-9 AM and 5-7 PM)
        return (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
    }
});