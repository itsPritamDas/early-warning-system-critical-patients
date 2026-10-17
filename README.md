<div align="center">

# 🏥 Early Warning System for Critical Patients

### An Interactive Critical-Care Monitoring Dashboard

**Simulated Vital Signs · Risk Visualization · Early Warning Alerts**

![Academic Demo](https://img.shields.io/badge/Project-Academic%20Demo-0f766e?style=for-the-badge)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

*A browser-based prototype that simulates patient vital signs and visualizes illustrative deterioration-risk scores through a modern clinical monitoring dashboard.*

</div>

---

## ✨ Overview

The **Early Warning System for Critical Patients** is an academic project that demonstrates how an interactive dashboard can visualize changes in critical-care vital signs and display potential warning states.

Choose a patient scenario, observe synthetic vital signs, and explore the risk gauge, timeline, feature-contribution bars, and alert log.

> [!IMPORTANT]
> **This is a simulation, not a clinical AI model.** The current implementation generates synthetic data and calculates an illustrative risk score using a formula. It does not run a trained CNN-LSTM neural network or connect to real hospital systems.

## 🎯 Key Features

| Feature | Description |
|---|---|
| 🧑‍⚕️ Patient Scenarios | Stable patient, sepsis-onset pattern, and cardiac-event pattern |
| 💓 Live Vital Signs | Heart rate, SpO₂, systolic blood pressure, respiratory rate, temperature, and lactate |
| 📊 Risk Gauge | Displays an illustrative deterioration-risk score |
| 📈 Risk Timeline | Visualizes changes in risk throughout the simulation |
| 🧩 Feature Contributions | Shows each vital sign's relative contribution to the calculated score |
| 🚨 Alert System | Generates warning and critical alerts |
| 📉 Vital Trends | Displays small charts for individual measurements |
| 🎮 Interactive Controls | Start, reset, and switch between simulation scenarios |
| 📱 Responsive UI | Modern, dark-themed monitoring dashboard |

## 🩺 Vital Signs Monitored

| Measurement | Unit | Reference Range |
|---|---|---|
| Heart Rate | bpm | 60–100 |
| Oxygen Saturation (SpO₂) | % | 95–100 |
| Systolic Blood Pressure | mmHg | 100–130 |
| Respiratory Rate | /min | 12–20 |
| Temperature | °C | 36.5–37.5 |
| Lactate | mmol/L | 0.5–2.0 |

*These are simplified ranges used by the demo, not individualized clinical thresholds.*

## 🚦 Risk Classification

| Risk Score | Status |
|---|---|
| Below 50% | 🟢 Stable |
| 50% to below 75% | 🟠 Warning |
| 75% or above | 🔴 Critical |

The JavaScript logic calculates weighted vital-sign deviations and worsening trends, then applies a sigmoid transformation to produce a score between 0 and 100.

**The score is illustrative and is not a clinically calibrated probability.**

## ⚙️ How It Works

```text
Select Patient Scenario
          ↓
Generate Synthetic Vital Signs
          ↓
Compare Measurements with Reference Ranges
          ↓
Calculate Weighted Deviations and Trends
          ↓
Apply Sigmoid Score Transformation
          ↓
Classify Risk Status
          ↓
Update Dashboard and Alert Log
```

- **60 simulation ticks**
- **12 simulated minutes per tick**
- **12 simulated hours** represented by the full timeline
- Dashboard updates approximately every 550 milliseconds while running

## 🛠️ Technology Stack

![HTML5](https://img.shields.io/badge/HTML5-Markup-orange?style=flat-square&logo=html5)
![CSS3](https://img.shields.io/badge/CSS3-Styling-blue?style=flat-square&logo=css3)
![JavaScript](https://img.shields.io/badge/Vanilla%20JavaScript-Logic-yellow?style=flat-square&logo=javascript)
![SVG](https://img.shields.io/badge/SVG-Visualization-purple?style=flat-square)

- **HTML5** — dashboard structure
- **CSS3** — styling, responsive layout, and status indicators
- **Vanilla JavaScript** — simulation logic and interactions
- **SVG** — risk gauge, sparklines, and timeline
- **Google Fonts** — Space Grotesk, IBM Plex Sans, and IBM Plex Mono

No framework, package installation, backend, or API key is required.

## 🚀 Getting Started

### Prerequisites

- A modern web browser such as Google Chrome, Microsoft Edge, or Firefox
- Git (optional, for cloning the repository)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with your GitHub username and repository name.

### 2. Run the Application

Open `index.html` directly in your browser.

### 3. Start the Simulation

1. Select a patient scenario from the dropdown.
2. Click **Run Simulation**.
3. Monitor the vital signs, risk gauge, timeline, and alert log.
4. Click **Reset** to restart the simulation.

## 📁 Project Structure

```text
early-warning-system-critical-patients/
├── index.html    # Dashboard, styles, and JavaScript simulation
└── README.md     # Project documentation
```

The current implementation is contained in a single HTML file.

## 🧠 Research Context

The wider academic project explores a proposed **CNN-LSTM architecture with an attention mechanism** for ICU time-series analysis.

- **CNN:** Intended to extract short-term patterns from physiological signals.
- **LSTM:** Intended to model temporal dependencies.
- **Attention:** Intended to emphasize relevant time steps.
- **Risk output:** Intended to support threshold-based warning generation.

**Current implementation status:** The neural network is part of the research concept, not the browser demo. The current dashboard uses synthetic data and a formula-based risk score.

## 🔭 Future Improvements

- Implement and train a CNN-LSTM model with attention.
- Integrate a trained model through a backend API.
- Add authorized, de-identified ICU datasets.
- Evaluate using AUROC, AUPRC, sensitivity, specificity, and prediction lead time.
- Add explainability visualizations based on a trained model.
- Validate performance across multiple datasets before considering clinical use.

## 👥 Contributors

- Rajib Roy
- **Pritam Das**
- Rahul Ghosh
- Pradyut Kumar De
- Pragya Das

**Department of Computer Science and Engineering**  
JIS University

## ⚠️ Disclaimer

This project is intended for educational, academic, and demonstration purposes only. It uses synthetic patient data and a formula-based risk score. It is not a trained or clinically validated medical AI system, is not a medical device, and must not be used to diagnose, monitor, or treat patients or make clinical decisions.

## 📄 License

No license has been specified yet. Add a `LICENSE` file if you decide to distribute this project under an open-source license.

---

<div align="center">

**Built as an academic project exploring early-warning visualization for critical care.**

</div>
