# Early Warning System for Critical Patients

An academic project exploring early warning for clinical deterioration using patient vital signs and laboratory time-series.

## Live demo

https://itspritamdas.github.io/early-warning-system-critical-patients/

## Project overview

The website provides an interactive ICU-monitoring dashboard with selectable synthetic patient scenarios, vital-sign trends, an illustrative risk index, alert history, feature-contribution visualization, and a conceptual CNN–LSTM with attention workflow.

The research report proposes a CNN–LSTM model with temporal attention and discusses preprocessing, patient-level time-series, early warning thresholds, and evaluation. Optional model training code is in the `ml/` directory.

## Run the website locally

1. Download or clone this repository.
2. Keep `index.html`, `styles.css`, and `app.js` in the same folder.
3. Open `index.html` in a modern browser, or serve the folder using a local static server.

No build step or JavaScript package installation is required for the dashboard.

## Interactive features

- Stable, sepsis-progression, and cardiac-event synthetic scenarios
- Risk index and low/elevated/critical display bands
- Selectable trend chart for risk, heart rate, SpO₂, systolic blood pressure, respiratory rate, or lactate
- Live-looking vital-sign and laboratory-value table with status and mini trend lines
- Simulated alert history and clear-log control
- CSV export of the generated synthetic session
- Responsive layout for desktop and mobile screens
- Research-methodology and proposed CNN–LSTM + attention architecture sections

## Project structure

```text
early-warning-system-critical-patients/
├── index.html
├── styles.css
├── app.js
├── README.md
└── ml/
    ├── README.md
    ├── model.py
    ├── prepare_data.py
    ├── train.py
    └── requirements.txt
```

## Important limitation

The GitHub Pages website is a **front-end simulation**. It generates synthetic values in the browser and computes an illustrative risk index with a formula. It does not connect to patient records, load trained model weights, or run CNN–LSTM inference. Do not interpret its score as a clinical probability or use it for diagnosis or treatment. The figures in the project report should be described as reported/sample results unless the corresponding experiment can be reproduced from a defined dataset, split, and saved model.

## Contributors

Rajib Roy, Pritam Das, Rahul Ghosh, Pradyut Kumar De, and Pragya Das  
Department of Computer Science and Engineering, JIS University

## License

No license is specified. Add a `LICENSE` file if you want to publish the project under an open-source license.
