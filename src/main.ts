import './style.css'
import { HearingTestController } from './HearingTestController';

const buttonEarLeft = document.getElementById('ear-left')!;
const buttonEarRight = document.getElementById('ear-right')!;
const buttonStartTest = document.getElementById('start-test')!;
const butonHeardTone = document.getElementById('heard-tone')!;

const placeHolderChartLeft = document.getElementById('chart-left')!;
const placeHolderChartRight = document.getElementById('chart-right')!;

const currentFrequencyText = document.getElementById('current-frequency')!;

const progressText = document.getElementById('progress-text')!;
const progressBar = document.getElementById('progress-bar')!;

const test = new HearingTestController({
  stepsPerOctave: 6,
  rampDuration: 4,
  stepTimeout: 8000
});

buttonStartTest.addEventListener('click', ()=>{
    butonHeardTone.removeAttribute('disabled');
    test.start();
})


const totalSteps = test.frequencies.length;
let index=0;
butonHeardTone.addEventListener('click', ()=>{
    progressBar.classList.remove(`w-0`);
    index++;
    const currentProgress = Math.round(index * 100 / totalSteps);
    progressBar.style.width = `${currentProgress}%`;
    progressText.textContent = `${index} / ${totalSteps}`;
    test.heard();
})