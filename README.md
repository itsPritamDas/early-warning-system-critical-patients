# Early Warning System for Critical Patients

An interactive, browser-based early warning dashboard that simulates patient vital signs, estimates deterioration risk, visualizes risk trends, and generates alerts for critical-care scenarios.

## Overview

The Early Warning System for Critical Patients is an academic project demonstrating how a digital monitoring dashboard can help visualize potential clinical deterioration.

The application simulates patient vital signs under three scenarios: stable patient, sepsis onset, and cardiac event. It calculates an illustrative risk score based on vital-sign deviations and worsening trends, then displays the results through a risk gauge, timeline, feature-contribution bars, and alert log.

The project is inspired by a proposed deep learning approach using a CNN-LSTM architecture with an attention mechanism. However, the current implementation is a front-end simulation and does not execute a trained deep learning model.

## Features

- **Multiple Patient Scenarios:** Choose between stable, sepsis-onset, and cardiac-event simulations.
- **Live Vital Signs:** Displays heart rate, oxygen saturation, systolic blood pressure, respiratory rate, temperature, and lactate.
- **Deterioration Risk Gauge:** Visualizes the estimated risk score as a percentage.
- **Risk Score Timeline:** Tracks changes in the risk score throughout the simulation.
- **Feature Contribution Visualization:** Displays the relative contribution of each vital sign to the calculated risk.
- **Early Warning Alerts:** Generates warning and critical alerts when the risk score crosses configured thresholds.
- **Alert History:** Records warning, critical, and resolved status changes.
- **Vital Sign Trends:** Uses mini charts to display changes in individual measurements.
- **Interactive Controls:** Start, reset, and switch between simulation scenarios.
- **Responsive Interface:** Provides a modern, dark-themed clinical monitoring dashboard.

## Technology Stack

- HTML5
- CSS3
- JavaScript (Vanilla JavaScript)
- SVG for data visualization
- Google Fonts:
  - Space Grotesk
  - IBM Plex Sans
  - IBM Plex Mono

## Vital Signs Monitored

| Vital Sign | Unit | Reference Range |
|---|---|---|
| Heart Rate | bpm | 60–100 |
| Oxygen Saturation (SpO₂) | % | 95–100 |
| Systolic Blood Pressure | mmHg | 100–130 |
| Respiratory Rate | /min | 12–20 |
| Body Temperature | °C | 36.5–37.5 |
| Lactate | mmol/L | 0.5–2.0 |

These ranges are simplified reference values used by the simulation and are not individualized clinical thresholds.

## Risk Classification

The application classifies the calculated risk score into three categories:

| Risk Score | Status |
|---|---|
| Below 50% | Stable |
| 50% to below 75% | Warning |
| 75% or above | Critical |

The risk score is calculated using weighted vital-sign deviations and worsening trends, followed by a sigmoid transformation.

**Note:** The score is illustrative and is not a clinically validated probability of patient deterioration.

## How It Works

1. Select a patient scenario from the dropdown menu.
2. Start the simulation using the **Run Simulation** button.
3. The application generates synthetic vital-sign measurements.
4. Each measurement is compared with its configured reference range.
5. The application calculates weighted deviations and worsening trends.
6. A formula converts the combined score into a percentage.
7. The dashboard updates the risk gauge, vital-sign cards, timeline, and feature-contribution bars.
8. Warning or critical alerts are added to the alert log when the status changes.
9. Use the **Reset** button to clear the current simulation and start again.

The simulation contains 60 ticks, with each tick representing 12 simulated minutes. This illustrates a 12-hour monitoring timeline.

## Getting Started

### Prerequisites

- A modern web browser, such as Google Chrome, Microsoft Edge, or Firefox.
- No Python installation, Node.js, package manager, or API key is required for the current implementation.

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Navigate to the project directory:

```bash
cd YOUR_REPOSITORY
```

Open `index.html` in your web browser.

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with your actual GitHub username and repository name.

### Running the Application

1. Open `index.html`.
2. Select a patient scenario.
3. Click **Run Simulation**.
4. Observe the changing vital signs, risk score, timeline, and alert log.
5. Click **Reset** to restart the simulation.

## Project Structure

```text
early-warning-system-critical-patients/
├── index.html
└── README.md
```

The current application is implemented in a single HTML file containing the page structure, styling, and JavaScript simulation logic.

## Project Architecture

The academic concept explores the following workflow:

```text
Patient Monitoring Data
        |
        v
Data Preprocessing
        |
        v
Feature Extraction
        |
        v
CNN-LSTM with Attention
        |
        v
Deterioration Risk Estimation
        |
        v
Threshold-Based Classification
        |
        v
Early Warning Alerts
```

This diagram represents the proposed deep learning workflow. The current browser demo implements synthetic data generation, formula-based risk estimation, threshold classification, and dashboard visualization rather than the complete neural network pipeline.

## Future Improvements

- Implement and integrate a trained CNN-LSTM model with an attention mechanism.
- Add a backend API for model inference.
- Support authorized, de-identified ICU datasets.
- Introduce data preprocessing and model training pipelines.
- Evaluate model performance using AUROC, AUPRC, sensitivity, specificity, and prediction lead time.
- Add explainability visualizations based on a trained model.
- Develop a real-time monitoring interface connected to a validated prediction service.
- Conduct external and prospective validation before considering clinical use.

## Contributors
- Pritam Das
- Rajib Roy
- Rahul Ghosh
- Pradyut Kumar De
- Pragya Das

Department of Computer Science and Engineering, JIS University.

## Disclaimer

This project is intended for educational, academic, and demonstration purposes only.

The application uses synthetically generated patient data and a formula-based risk score. It is not a trained or clinically validated medical AI system, is not a medical device, and must not be used to diagnose, monitor, or treat patients or to make clinical decisions.

## License

Add a license file if you intend to distribute this project under a specific open-source license.
