import "./style.css";
import { HearingTestController } from "./HearingTestController";
import { initCharts, updateChartsFromMeasured } from "./charts";
import type { HearingResult } from "./types";
import { EXTENDED_TEST_FREQUENCIES } from "./frequencies";

const buttonEarLeft = document.getElementById("ear-left")!;
const buttonEarRight = document.getElementById("ear-right")!;
const buttonStartTest = document.getElementById("start-test")!;
const butonHeardTone = document.getElementById("heard-tone")!;

const currentFrequencyText = document.getElementById("current-frequency")!;

const progressText = document.getElementById("progress-text")!;
const progressBar = document.getElementById("progress-bar")!;

const smoothingSlider = document.getElementById("smoothing-slider") as HTMLInputElement;
const smoothingValue = document.getElementById("smoothing-value")!;

const test = new HearingTestController({
  rampPower: 10.0,
  rampDuration: 5.0,
  stepTimeout: 5000,
  mode: "fixed",
  frequencies: EXTENDED_TEST_FREQUENCIES,
});

const totalSteps = test.getTotalSteps();
const progressIndex = test.getIndex();
progressText.textContent = `${progressIndex} / ${totalSteps}`;

test.nextEventCustomHandler = () => {
  setProgress();
  currentFrequencyText.textContent = `${test.getCurrentFrequency()} Hz`;
}

const testResults = {
  left: [] as HearingResult[],
  right: [] as HearingResult[],
}

test.testFinishedCustomHandler = () => {
        const leftMeasured = test.results
            .filter((r) => r.ear === "left");

        const rightMeasured = test.results
            .filter((r) => r.ear === "right");

        if (leftMeasured.length > 0) testResults.left = leftMeasured;
        if (rightMeasured.length > 0) testResults.right = rightMeasured;

        const smoothing = parseInt(smoothingSlider.value);
        updateChartsFromMeasured(testResults.left, testResults.right, test.getFrequencyList(), smoothing);

        butonHeardTone.setAttribute("disabled", "true");
        currentFrequencyText.textContent = "— Hz";
}

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
        updateChartsFromMeasured(testResults.left, testResults.right, test.getFrequencyList(), smoothing);
    }
});

// Initialize smoothing label
updateSmoothingLabel(0);

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

  progressBar.classList.remove(`w-0`); //TODO: remove this.
  test.heard();
});

function setProgress() {
    const currentStep = test.getIndex() + 1;
    const currentProgress = Math.round((currentStep * 100) / totalSteps);
    progressBar.style.width = `${currentProgress}%`;
    progressText.textContent = `${currentStep} / ${totalSteps}`;
}
