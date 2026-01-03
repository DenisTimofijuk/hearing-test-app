import { Chart, registerables } from "chart.js";

// Register all necessary components of Chart.js
Chart.register(...registerables);

type MeasuredPoint = { frequency: number; gain: number };

let leftChart: any = null;
let rightChart: any = null;

function makeChart(ctx: CanvasRenderingContext2D, label: string) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label,
          data: [],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.08)",
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: "dB (20·log10(gain))" },
        },
      },
    },
  });
}

function interpMeasuredToDb(measured: MeasuredPoint[], targetFreqs: number[]) {
  const measuredFiltered = measured
    .map((m) => ({ f: m.frequency, db: 20 * Math.log10(m.gain) }))
    .sort((a, b) => a.f - b.f);

  if (measuredFiltered.length === 0) {
    return null;
    // return targetFreqs.map(() => null);
  }

  const interp = (f: number) => {
    if (measuredFiltered.some((m) => m.f === f)) {
      return measuredFiltered.find((m) => m.f === f)!.db;
    }
    const logF = Math.log(f);
    let left = measuredFiltered[0];
    let right = measuredFiltered[measuredFiltered.length - 1];
    for (let i = 0; i < measuredFiltered.length - 1; i++) {
      const a = measuredFiltered[i];
      const b = measuredFiltered[i + 1];
      if (Math.log(a.f) <= logF && logF <= Math.log(b.f)) {
        left = a;
        right = b;
        break;
      }
    }
    const t = (Math.log(f) - Math.log(left.f)) / (Math.log(right.f) - Math.log(left.f));
    return left.db + t * (right.db - left.db);
  };

  return targetFreqs.map((f) => interp(f));
}

export function initCharts(leftCanvasId: string, rightCanvasId: string) {
  const leftCanvas = document.getElementById(leftCanvasId) as HTMLCanvasElement | null;
  const rightCanvas = document.getElementById(rightCanvasId) as HTMLCanvasElement | null;

  if (leftCanvas) {
    const ctx = leftCanvas.getContext("2d")!;
    leftChart = makeChart(ctx, "Left Ear");
  }
  if (rightCanvas) {
    const ctx = rightCanvas.getContext("2d")!;
    rightChart = makeChart(ctx, "Right Ear");
  }
}

export function updateChartsFromMeasured(
  leftMeasured: MeasuredPoint[],
  rightMeasured: MeasuredPoint[],
  targetFreqs: number[]
) {
  const labels = targetFreqs.map((f) => `${f} Hz`);
  const leftData = interpMeasuredToDb(leftMeasured, targetFreqs);
  const rightData = interpMeasuredToDb(rightMeasured, targetFreqs);

  if (leftChart && leftData) {
    leftChart.data.labels = labels;
    leftChart.data.datasets[0].data = leftData;
    leftChart.update();
  }
  if (rightChart && rightData) {
    rightChart.data.labels = labels;
    rightChart.data.datasets[0].data = rightData;
    rightChart.update();
  }
}
