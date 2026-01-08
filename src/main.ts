import "./style.css";
import { HearingTestController } from "./HearingTestController";
import { initCharts, updateChartsFromMeasured } from "./charts";
import type { HearingResult } from "./types";
import {
    MINIMAL_TEST_FREQUENCIES,
    MEDIUM_TEST_FREQUENCIES,
    EXTENDED_TEST_FREQUENCIES,
} from "./frequencies";

const buttonStartTest = document.getElementById(
    "start-test"
) as HTMLButtonElement;
const butonHeardTone = document.getElementById(
    "heard-tone"
) as HTMLButtonElement;
const testRange = document.getElementById("test-range") as HTMLSelectElement;

const currentFrequencyText = document.getElementById("current-frequency")!;

const leftProgressText = document.getElementById(
    "left-progress-text"
) as HTMLDivElement;
const leftProgressBar = document.getElementById(
    "left-progress-bar"
) as HTMLDivElement;

const rightProgressText = document.getElementById(
    "right-progress-text"
) as HTMLDivElement;
const rightProgressBar = document.getElementById(
    "right-progress-bar"
) as HTMLDivElement;

const smoothingSlider = document.getElementById(
    "smoothing-slider"
) as HTMLInputElement;
const smoothingValue = document.getElementById("smoothing-value")!;

const test = new HearingTestController({
    rampPower: 10.0,
    rampDuration: 5.0,
    stepTimeout: 5000,
});

test.setFrequencies(MINIMAL_TEST_FREQUENCIES);

updateProgressLable();

test.nextEventCustomHandler = () => {
    setProgress();
    currentFrequencyText.textContent = `${test.getCurrentFrequency()} Hz`;
};

const testResults = {
    left: [] as HearingResult[],
    right: [] as HearingResult[],
};

test.testFinishedCustomHandler = () => {
    const leftMeasured = test.results.filter((r) => r.ear === "left");

    const rightMeasured = test.results.filter((r) => r.ear === "right");

    if (leftMeasured.length > 0) testResults.left = leftMeasured;
    if (rightMeasured.length > 0) testResults.right = rightMeasured;

    const smoothing = parseInt(smoothingSlider.value);
    updateChartsFromMeasured(
        testResults.left,
        testResults.right,
        test.getFrequencyList(),
        smoothing
    );

    butonHeardTone.setAttribute("disabled", "true");
    testRange.removeAttribute("disabled");
    buttonStartTest.removeAttribute("disabled");
    currentFrequencyText.textContent = "— Hz";
};

// Update smoothing label text based on value
function updateSmoothingLabel(value: number) {
    let label = "";
    if (value === 0) label = "0 (Raw Data)";
    else if (value <= 3) label = `${value} (Light)`;
    else if (value <= 7) label = `${value} (Medium)`;
    else label = `${value} (Heavy)`;
    smoothingValue.textContent = label;
}

// initialize charts once DOM is ready
initCharts("chart-left-canvas", "chart-right-canvas");

// Smoothing slider event listener
smoothingSlider.addEventListener("input", () => {
    const smoothing = parseInt(smoothingSlider.value);
    updateSmoothingLabel(smoothing);

    // Re-render charts if we have results
    if (testResults.left.length > 0 || testResults.right.length > 0) {
        updateChartsFromMeasured(
            testResults.left,
            testResults.right,
            test.getFrequencyList(),
            smoothing
        );
    }
});

// Initialize smoothing label
updateSmoothingLabel(0);

buttonStartTest.addEventListener("click", () => {
    testRange.setAttribute("disabled", "true");
    buttonStartTest.setAttribute("disabled", "true");
    butonHeardTone.removeAttribute("disabled");
    leftProgressBar.classList.remove(`w-0`);
    leftProgressBar.style.width = `0%`;
    rightProgressBar.classList.remove(`w-0`);
    rightProgressBar.style.width = `0%`;
    test.start();
});

butonHeardTone.addEventListener("click", () => {
    test.heard();
});

testRange.addEventListener("change", () => {
    const value = testRange.value;
    switch (value) {
        case "minimal":
            test.setFrequencies(MINIMAL_TEST_FREQUENCIES);
            break;
        case "medium":
            test.setFrequencies(MEDIUM_TEST_FREQUENCIES);
            break;
        case "extended":
            test.setFrequencies(EXTENDED_TEST_FREQUENCIES);
            break;
    }

    test.resetIndex();
    updateProgressLable();
});

// trigger "heard" action with Spacebar (unless user is typing in a field)
window.addEventListener("keydown", (e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement | null;
    const typing =
        !!active &&
        (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.isContentEditable);
    if (typing) return;

    const isSpace = e.code === "Space" || e.key === " " || e.key === "Spacebar";
    if (!isSpace) return;

    e.preventDefault();
    if (test.isFinished()) return;

    test.heard();
});

function setProgress() {
    const currentStep = test.getIndex() + 1;
    const currentProgress = Math.round(
        (currentStep * 100) / test.getTotalSteps()
    );
    if (test.ear === "left") {
        leftProgressBar.style.width = `${currentProgress}%`;
        leftProgressText.textContent = `${currentStep} / ${test.getTotalSteps()}`;
    } else {
        rightProgressBar.style.width = `${currentProgress}%`;
        rightProgressText.textContent = `${currentStep} / ${test.getTotalSteps()}`;
    }
}

function updateProgressLable() {
    leftProgressText.textContent = `${test.getIndex()} / ${test.getTotalSteps()}`;
    rightProgressText.textContent = `${test.getIndex()} / ${test.getTotalSteps()}`;
}
