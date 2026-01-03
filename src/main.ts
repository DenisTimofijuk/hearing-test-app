import "./style.css";
import { HearingTestController } from "./HearingTestController";

const buttonEarLeft = document.getElementById("ear-left")!;
const buttonEarRight = document.getElementById("ear-right")!;
const buttonStartTest = document.getElementById("start-test")!;
const butonHeardTone = document.getElementById("heard-tone")!;

const placeHolderChartLeft = document.getElementById("chart-left")!;
const placeHolderChartRight = document.getElementById("chart-right")!;

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
    placeHolderChartLeft.textContent = "Left ear chart would be rendered here.";
    placeHolderChartRight.textContent = "Right ear chart would be rendered here.";
    butonHeardTone.setAttribute("disabled", "true");
    currentFrequencyText.textContent = '— Hz';
}

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
