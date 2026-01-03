import "./style.css";
import { HearingTestController } from "./HearingTestController";
import { initCharts, updateChartsFromMeasured } from "./charts";

const buttonEarLeft = document.getElementById("ear-left")!;
const buttonEarRight = document.getElementById("ear-right")!;
const buttonStartTest = document.getElementById("start-test")!;
const butonHeardTone = document.getElementById("heard-tone")!;

const currentFrequencyText = document.getElementById("current-frequency")!;

const progressText = document.getElementById("progress-text")!;
const progressBar = document.getElementById("progress-bar")!;

const test = new HearingTestController({});

const totalSteps = test.frequencies.length;
progressText.textContent = `${test.index} / ${totalSteps}`;

test.nextEventCustomHandler = () => {
  setProgress();
  currentFrequencyText.textContent = `${test.getCurrentFrequency()} Hz`;
}

test.testFinishedCustomHandler = () => {
        // prepare measured points per ear
        const leftMeasured = test.results
            .filter((r) => r.ear === "left" && r.gain !== null)
            .map((r) => ({ frequency: r.frequency, gain: r.gain as number }));

        const rightMeasured = test.results
            .filter((r) => r.ear === "right" && r.gain !== null)
            .map((r) => ({ frequency: r.frequency, gain: r.gain as number }));

        updateChartsFromMeasured(leftMeasured, rightMeasured, test.frequencies);
        butonHeardTone.setAttribute("disabled", "true");
        currentFrequencyText.textContent = "— Hz";
}

// initialize charts once DOM is ready
initCharts("chart-left-canvas", "chart-right-canvas");

buttonEarLeft.addEventListener("click", () => {
    buttonEarLeft.classList.add("selected");
    buttonEarRight.classList.remove("selected");
    test.setEar("left");
});

buttonEarRight.addEventListener("click", () => {
    buttonEarRight.classList.add("selected");
    buttonEarLeft.classList.remove("selected");
    test.setEar("right");
});

buttonStartTest.addEventListener("click", () => {
    butonHeardTone.removeAttribute("disabled");
    test.start();
});

butonHeardTone.addEventListener("click", () => {
    progressBar.classList.remove(`w-0`); //TODO: remove this.
    test.heard();
});

function setProgress() {
    const currentStep = test.index + 1;
    const currentProgress = Math.round((currentStep * 100) / totalSteps);
    progressBar.style.width = `${currentProgress}%`;
    progressText.textContent = `${currentStep} / ${totalSteps}`;
}
