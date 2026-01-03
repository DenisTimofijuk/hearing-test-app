import { Chart, registerables } from "chart.js";

// Register all necessary components of Chart.js
Chart.register(...registerables);

// Maximum gain used in tone generation - used to normalize hearing thresholds
const MAX_GAIN = 0.7;

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
          min: 0,
          max: 60,
          title: { display: true, text: "Hearing Level (dB HL)" },
          ticks: {
            callback: (value) => `${value} dB`,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        filler: {
          propagate: true,
        },
      },
    },
    plugins: [
      {
        id: "hearingZones",
        afterDatasetsDraw(chart: any) {
          const ctx = chart.ctx;
          const yAxis = chart.scales.y;
          const xAxis = chart.scales.x;

          const zones = [
            { min: 0, max: 20, color: "rgba(34, 197, 94, 0.1)", label: "Normal" },
            { min: 20, max: 40, color: "rgba(234, 179, 8, 0.1)", label: "Mild" },
            { min: 40, max: 60, color: "rgba(239, 68, 68, 0.1)", label: "Moderate" },
          ];

          zones.forEach((zone) => {
            const yStart = yAxis.getPixelForValue(zone.max);
            const yEnd = yAxis.getPixelForValue(zone.min);
            ctx.fillStyle = zone.color;
            ctx.fillRect(xAxis.left, yStart, xAxis.right - xAxis.left, yEnd - yStart);
          });
        },
      },
    ],
  });
}

function interpMeasuredToDb(measured: MeasuredPoint[], targetFreqs: number[]) {
  const measuredFiltered = measured
    .map((m) => {
      // Map gain (0..MAX_GAIN) to hearing level 0..60 dB HL and clamp
      const raw = (m.gain / MAX_GAIN) * 60;
      const db = Math.min(Math.max(raw, 0), 60);
      return { f: m.frequency, db };
    })
    .sort((a, b) => a.f - b.f);

  if (measuredFiltered.length === 0) {
    return null;
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

export function calculateHearingSummary(measured: MeasuredPoint[]): {
  category: string;
  level: "normal" | "mild" | "moderate" | "severe";
  description: string;
} {
  if (measured.length === 0) {
    return {
      category: "No data",
      level: "normal",
      description: "Unable to determine hearing status",
    };
  }

  // Map gains to 0..60 dB HL and clamp values
  const dbValues = measured.map((m) => {
    const raw = (m.gain / MAX_GAIN) * 60;
    return Math.min(Math.max(raw, 0), 60);
  });
  const avgDb = dbValues.reduce((a, b) => a + b, 0) / dbValues.length;

  if (avgDb < 20) {
    return {
      category: "Normal Hearing",
      level: "normal",
      description: "Your hearing is within normal limits",
    };
  } else if (avgDb < 40) {
    return {
      category: "Mild Hearing Loss",
      level: "mild",
      description: "You may have difficulty with soft sounds in noisy environments",
    };
  } else if (avgDb < 60) {
    return {
      category: "Moderate Hearing Loss",
      level: "moderate",
      description: "You may have difficulty with normal conversation",
    };
  } else {
    return {
      category: "Severe Hearing Loss",
      level: "severe",
      description: "Consider consulting an audiologist",
    };
  }
}
