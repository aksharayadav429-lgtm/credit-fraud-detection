
const button =
    document.getElementById("predictButton");

const testFraudButton =
    document.getElementById("testFraudButton");


const prediction =
    document.getElementById("prediction");

const fraudProbability =
    document.getElementById("fraudProbability");

const status =
    document.getElementById("status");


const amount =
    document.getElementById("amount");

const time =
    document.getElementById("time");

const locationScore =
    document.getElementById("locationScore");

const frequency =
    document.getElementById("frequency");

const deviceScore =
    document.getElementById("deviceScore");


const thresholdSlider =
    document.getElementById("threshold");

const thresholdValue =
    document.getElementById("thresholdValue");


const accuracy =
    document.getElementById("accuracy");

const precision =
    document.getElementById("precision");

const recall =
    document.getElementById("recall");

const f1 =
    document.getElementById("f1");


const tn =
    document.getElementById("tn");

const fp =
    document.getElementById("fp");

const fn =
    document.getElementById("fn");

const tp =
    document.getElementById("tp");


const chartCanvas =
    document.getElementById("performanceChart");


let performanceChart = null;

let performanceData = [];



/* =========================================
   PREDICT TRANSACTION
========================================= */

button.addEventListener(
    "click",
    async function () {

        console.log(
            "Predict button clicked"
        );


        prediction.textContent =
            "Predicting...";


        fraudProbability.textContent =
            "Calculating...";


        status.textContent =
            "Connecting to backend...";


        const transactionData = {

            amount:
                Number(amount.value),

            time:
                Number(time.value),

            location_score:
                Number(locationScore.value),

            frequency:
                Number(frequency.value),

            device_score:
                Number(deviceScore.value),

            threshold:
                Number(thresholdSlider.value)

        };


        try {

            const response =
                await fetch(
                    "/predict",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                transactionData
                            )
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Prediction request failed"
                );

            }


            const data =
                await response.json();


            prediction.textContent =
                data.prediction;


            fraudProbability.textContent =
                data.fraud_probability_percentage
                + "%";


            if (
                data.prediction ===
                "Fraud"
            ) {

                prediction.style.color =
                    "#d32f2f";

            } else {

                prediction.style.color =
                    "#2e7d32";

            }


            status.textContent =
                "Transaction prediction completed.";

        }

        catch (error) {

            console.error(error);


            prediction.textContent =
                "Error";


            fraudProbability.textContent =
                "-";


            status.textContent =
                "Unable to connect to the backend.";

        }

    }
);



/* =========================================
   TEST FRAUD TRANSACTION
========================================= */

testFraudButton.addEventListener(
    "click",
    async function () {

        /*
         * Fill the form with a test transaction.
         */

        amount.value = 50000;

        time.value = 2;

        locationScore.value = 5;

        frequency.value = 100;

        deviceScore.value = 5;


        /*
         * Use a 0.50 threshold.
         */

        thresholdSlider.value =
            0.50;

        thresholdValue.textContent =
            "0.50";


        status.textContent =
            "Testing a fraud transaction...";


        /*
         * Automatically run prediction.
         */

        button.click();

    }
);



/* =========================================
   UPDATE METRICS
========================================= */

async function updateMetrics() {

    const threshold =
        Number(
            thresholdSlider.value
        );


    thresholdValue.textContent =
        threshold.toFixed(2);


    try {

        const response =
            await fetch(
                "/metrics",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            threshold:
                                threshold
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Metrics request failed"
            );

        }


        const data =
            await response.json();


        accuracy.textContent =
            (
                data.accuracy * 100
            ).toFixed(2) + "%";


        precision.textContent =
            (
                data.precision * 100
            ).toFixed(2) + "%";


        recall.textContent =
            (
                data.recall * 100
            ).toFixed(2) + "%";


        f1.textContent =
            (
                data.f1_score * 100
            ).toFixed(2) + "%";


        tn.textContent =
            data.confusion_matrix
                .true_negative;


        fp.textContent =
            data.confusion_matrix
                .false_positive;


        fn.textContent =
            data.confusion_matrix
                .false_negative;


        tp.textContent =
            data.confusion_matrix
                .true_positive;


        updateChartMarker(
            threshold
        );


        status.textContent =
            "Metrics updated successfully.";

    }

    catch (error) {

        console.error(error);

        status.textContent =
            "Unable to load metrics.";

    }

}



/* =========================================
   LOAD PERFORMANCE DATA
========================================= */

async function loadPerformanceData() {

    try {

        const response =
            await fetch(
                "/threshold-metrics"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load threshold metrics"
            );

        }


        performanceData =
            await response.json();


        createPerformanceChart();

    }

    catch (error) {

        console.error(error);


        status.textContent =
            "Unable to load performance chart.";

    }

}



/* =========================================
   CREATE PERFORMANCE CHART
========================================= */

function createPerformanceChart() {

    if (!chartCanvas) {

        console.error(
            "Performance chart canvas not found"
        );

        return;

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not loaded"
        );


        status.textContent =
            "Chart.js could not be loaded.";

        return;

    }


    const accuracyData =
        performanceData.map(
            item => ({
                x: item.threshold,

                y:
                    item.accuracy * 100
            })
        );


    const precisionData =
        performanceData.map(
            item => ({
                x: item.threshold,

                y:
                    item.precision * 100
            })
        );


    const recallData =
        performanceData.map(
            item => ({
                x: item.threshold,

                y:
                    item.recall * 100
            })
        );


    const f1Data =
        performanceData.map(
            item => ({
                x: item.threshold,

                y:
                    item.f1_score * 100
            })
        );


    performanceChart =
        new Chart(
            chartCanvas.getContext("2d"),
            {

                type: "line",


                data: {

                    datasets: [

                        {
                            label:
                                "Accuracy",

                            data:
                                accuracyData,

                            borderWidth: 3,

                            pointRadius: 3,

                            tension: 0.3,

                            fill: false
                        },


                        {
                            label:
                                "Precision",

                            data:
                                precisionData,

                            borderWidth: 3,

                            pointRadius: 3,

                            tension: 0.3,

                            fill: false
                        },


                        {
                            label:
                                "Recall",

                            data:
                                recallData,

                            borderWidth: 3,

                            pointRadius: 3,

                            tension: 0.3,

                            fill: false
                        },


                        {
                            label:
                                "F1 Score",

                            data:
                                f1Data,

                            borderWidth: 3,

                            pointRadius: 3,

                            tension: 0.3,

                            fill: false
                        },


                        {
                            label:
                                "Current Threshold",

                            data: [],

                            showLine: false,

                            pointRadius: 8,

                            pointHoverRadius: 10,

                            borderWidth: 2
                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "nearest",

                        intersect:
                            false

                    },


                    scales: {

                        x: {

                            type:
                                "linear",

                            min:
                                0,

                            max:
                                1,


                            title: {

                                display:
                                    true,

                                text:
                                    "Fraud Probability Threshold"

                            },


                            ticks: {

                                stepSize:
                                    0.05,

                                callback:
                                    function(value) {

                                        return Number(
                                            value
                                        ).toFixed(2);

                                    }

                            }

                        },


                        y: {

                            min:
                                0,

                            max:
                                100,


                            title: {

                                display:
                                    true,

                                text:
                                    "Performance (%)"

                            },


                            ticks: {

                                callback:
                                    function(value) {

                                        return (
                                            value + "%"
                                        );

                                    }

                            }

                        }

                    },


                    plugins: {

                        legend: {

                            display:
                                true,

                            position:
                                "top"

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        return (
                                            context.dataset.label +
                                            ": " +
                                            context.parsed.y
                                                .toFixed(2) +
                                            "%"
                                        );

                                    }

                            }

                        }

                    }

                }

            }

        );


    updateChartMarker(
        Number(
            thresholdSlider.value
        )
    );

}



/* =========================================
   UPDATE CURRENT THRESHOLD MARKER
========================================= */

function updateChartMarker(
    threshold
) {

    if (
        !performanceChart ||
        performanceData.length === 0
    ) {

        return;

    }


    let closest =
        performanceData[0];


    let smallestDifference =
        Math.abs(
            threshold -
            performanceData[0].threshold
        );


    for (
        let i = 1;
        i < performanceData.length;
        i++
    ) {

        const difference =
            Math.abs(
                threshold -
                performanceData[i].threshold
            );


        if (
            difference <
            smallestDifference
        ) {

            smallestDifference =
                difference;

            closest =
                performanceData[i];

        }

    }


    performanceChart
        .data
        .datasets[4]
        .data = [

            {
                x:
                    closest.threshold,

                y:
                    closest.f1_score * 100
            }

        ];


    performanceChart.update(
        "none"
    );

}



/* =========================================
   THRESHOLD SLIDER
========================================= */

thresholdSlider.addEventListener(
    "input",
    function() {

        updateMetrics();

    }
);



/* =========================================
   START APPLICATION
========================================= */

async function startApplication() {

    await loadPerformanceData();

    await updateMetrics();

}


startApplication();
