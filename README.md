# Early Warning System for Critical Patients

## Overview

The Early Warning System for Critical Patients is an academic project that demonstrates how patient vital signs can be monitored through a web-based dashboard. It simulates changes in vital signs and displays an illustrative risk score to show how early warning alerts may work.

This version is a front-end prototype. It uses synthetic data and a formula-based risk score. It does not run a trained CNN-LSTM model or connect to real hospital systems.

## Features

- Simulated patient scenarios, including stable, sepsis-onset, and cardiac-event patterns
- Display of vital signs such as heart rate, oxygen saturation, blood pressure, respiratory rate, temperature, and lactate
- Risk score visualization
- Timeline and feature-contribution displays
- Warning and critical alerts
- Alert log for observing changes over time

## Technologies Used

- HTML
- CSS
- JavaScript
- SVG for dashboard visualizations

## How to Run

1. Clone or download this repository.
2. Open the project folder.
3. Open `index.html` in a modern web browser.

No backend server or package installation is required for the current prototype.

## Project Structure

```text
early-warning-system-critical-patients/
├── index.html
└── README.md
```

The exact files in your repository may vary.

## Limitations

- The patient data is simulated, not collected from real patients.
- The displayed risk score is illustrative and is calculated using a formula.
- The prototype is for educational and demonstration purposes only.
- It is not a medical device and must not be used for diagnosis or clinical decisions.

## Future Improvements

- Train and evaluate a CNN-LSTM model using an appropriate, ethically sourced clinical dataset
- Add data preprocessing and model evaluation
- Connect the dashboard to a backend service
- Validate risk thresholds with qualified clinical experts
- Improve testing, documentation, and deployment

## Contributors

- Rajib Roy
- Pritam Das
- Rahul Ghosh
- Pradyut Kumar De
- Pragya Das

Department of Computer Science and Engineering, JIS University.

## License

No license has been specified yet. Add a license file if you want to define how others may use, modify, and distribute this project.
