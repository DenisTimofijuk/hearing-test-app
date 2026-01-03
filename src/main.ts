import "./style.css";
import { HearingTestController } from "./HearingTestController";
import { initCharts, updateChartsFromMeasured, calculateHearingSummary } from "./charts";
import { EXTENDED_TEST_FREQUENCIES } from "./frequencies";

const buttonEarLeft = document.getElementById("ear-left")!;
const buttonEarRight = document.getElementById("ear-right")!;
const buttonStartTest = document.getElementById("start-test")!;
const butonHeardTone = document.getElementById("heard-tone")!;

const currentFrequencyText = document.getElementById("current-frequency")!;

const progressText = document.getElementById("progress-text")!;
const progressBar = document.getElementById("progress-bar")!;

const test = new HearingTestController({
  rampPower: 10.0,
  rampDuration: 5.0,
  stepTimeout: 5000,
  frequencies: EXTENDED_TEST_FREQUENCIES
});

const totalSteps = test.frequencies.length;
progressText.textContent = `${test.index} / ${totalSteps}`;

test.nextEventCustomHandler = () => {
  setProgress();
  currentFrequencyText.textContent = `${test.getCurrentFrequency()} Hz`;
}

test.testFinishedCustomHandler = () => {
        // prepare measured points per ear
        // For frequencies not heard (gain is null), assign a very low gain value (0.001)
        // which corresponds to severe hearing loss (~60 dB HL)
        const leftMeasured = test.results
            .filter((r) => r.ear === "left")
            .map((r) => ({
                frequency: r.frequency,
                gain: r.gain || test.maxGain
            }));

        const rightMeasured = test.results
            .filter((r) => r.ear === "right")
            .map((r) => ({
                frequency: r.frequency,
                gain: r.gain || test.maxGain
            }));

        updateChartsFromMeasured(leftMeasured, rightMeasured, test.frequencies);
        
        // Display hearing summaries
        const leftSummary = calculateHearingSummary(leftMeasured);
        const rightSummary = calculateHearingSummary(rightMeasured);
        
        const resultSection = document.getElementById("result-summary");
        if (resultSection) {
          resultSection.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div style="padding: 1rem; background: rgba(37,99,235,0.05); border-radius: 8px;">
                <h3 style="margin: 0 0 0.5rem 0; color: #1e40af;">Left Ear</h3>
                <p style="margin: 0 0 0.5rem 0; font-weight: bold; font-size: 1.125rem;">${leftSummary.category}</p>
                <p style="margin: 0; color: #666; font-size: 0.875rem;">${leftSummary.description}</p>
              </div>
              <div style="padding: 1rem; background: rgba(37,99,235,0.05); border-radius: 8px;">
                <h3 style="margin: 0 0 0.5rem 0; color: #1e40af;">Right Ear</h3>
                <p style="margin: 0 0 0.5rem 0; font-weight: bold; font-size: 1.125rem;">${rightSummary.category}</p>
                <p style="margin: 0; color: #666; font-size: 0.875rem;">${rightSummary.description}</p>
              </div>
            </div>
          `;
        }
        
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
    const currentStep = test.index + 1;
    const currentProgress = Math.round((currentStep * 100) / totalSteps);
    progressBar.style.width = `${currentProgress}%`;
    progressText.textContent = `${currentStep} / ${totalSteps}`;
}
