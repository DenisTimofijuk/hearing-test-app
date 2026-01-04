import { Chart, registerables } from "chart.js";
import type { HearingResult } from "./types";

// Register all necessary components of Chart.js
Chart.register(...registerables);


let leftChart: any = null;
let rightChart: any = null;

interface BackgroundZone {
  min: number;
  max: number;
  color: string;
  label: string;
}

function makeChart(ctx: CanvasRenderingContext2D, label: string) {
  const chart = new Chart(ctx, {
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
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          reverse: true, // Lower values (better hearing) at top
          title: { display: true, text: "Threshold (dB)" },
          ticks: {
            callback: (value) => `${value} dB`,
          },
        },
        x: {
          title: { display: true, text: "Frequency" },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `${context.dataset.label}: ${value.toFixed(1)} dB`;
            },
          },
        },
      },
    },
    plugins: [
      {
        id: "backgroundZones",
        beforeDatasetsDraw(chart: any) {
          if (!chart.config._backgroundZones) return;

          const ctx = chart.ctx;
          const yAxis = chart.scales.y;
          const xAxis = chart.scales.x;
          const zones: BackgroundZone[] = chart.config._backgroundZones;

          zones.forEach((zone) => {
            const yStart = yAxis.getPixelForValue(zone.min);
            const yEnd = yAxis.getPixelForValue(zone.max);
            ctx.fillStyle = zone.color;
            ctx.fillRect(xAxis.left, yStart, xAxis.right - xAxis.left, yEnd - yStart);
          });
        },
      },
    ],
  });

  // Store zones in a custom property
  (chart.config as any)._backgroundZones = [];

  return chart;
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

/**
 * Calculate dynamic y-axis range that ensures all data is visible
 * with appropriate padding.
 */
function calculateDynamicRange(leftData: number[], rightData: number[]) {
  const allValues = [...leftData, ...rightData].filter((v) => isFinite(v));

  if (allValues.length === 0) {
    return { min: -40, max: 0 };
  }

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min;

  // Add 20% padding on each side to ensure visibility
  const padding = Math.max(range * 0.2, 5);

  return {
    min: Math.floor(min - padding),
    max: Math.ceil(max + padding),
  };
}

/**
 * Create background zones based on the data distribution.
 * Shows where each ear falls relative to the overall range.
 */
function createRelativeZones(min: number, max: number) {
  const range = max - min;
  const third = range / 3;

  return [
    { min: min, max: min + third, color: "rgba(34, 197, 94, 0.08)", label: "Best" },
    { min: min + third, max: min + 2 * third, color: "rgba(234, 179, 8, 0.08)", label: "Middle" },
    { min: min + 2 * third, max: max, color: "rgba(239, 68, 68, 0.08)", label: "Worst" },
  ];
}

/**
 * Apply smoothing to threshold data to reduce reaction-time variability.
 * Uses weighted moving average with Gaussian-like weights.
 *
 * @param data - Raw threshold values in dB
 * @param intensity - Smoothing intensity (0-10):
 *   0 = no smoothing (raw data)
 *   1-3 = light smoothing (reduces jitter)
 *   4-7 = medium smoothing (significant noise reduction)
 *   8-10 = heavy smoothing (very smooth curves)
 * @returns Smoothed threshold values
 */
function applySmoothingToData(data: number[], intensity: number): number[] {
  // No smoothing
  if (intensity <= 0 ) {
    return data;
  }

  // Map intensity (0-10) to window size (1-5)
  const windowSize = Math.min(5, Math.ceil(intensity / 2));

  // Map intensity to weight concentration (how much to favor center point)
  // Higher values = center point has more weight = less aggressive smoothing
  const centerWeight = Math.max(1, 11 - intensity);

  const smoothed: number[] = [];

  for (let i = 0; i < data.length; i++) {
    let weightedSum = 0;
    let totalWeight = 0;

    // Apply weighted average within window
    for (let j = -windowSize; j <= windowSize; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < data.length) {
        // Gaussian-like weight: center has most weight, falls off with distance
        const distance = Math.abs(j);
        const weight = distance === 0 ? centerWeight : 1 / (distance + 1);

        weightedSum += data[idx] * weight;
        totalWeight += weight;
      }
    }

    smoothed[i] = weightedSum / totalWeight;
  }

  return smoothed;
}

/**
 * Generate a summary showing left vs right differences.
 */
function generateComparisonSummary(leftData: number[], rightData: number[], frequencies: number[]) {
  if (leftData.length === 0 || rightData.length === 0) {
    return "<p class='text-gray-500 text-center'>Complete tests for both ears to see comparison.</p>";
  }

  const differences = leftData.map((left, i) => ({
    freq: frequencies[i],
    left,
    right: rightData[i],
    diff: Math.abs(left - rightData[i]),
  }));

  const avgLeft = leftData.reduce((a, b) => a + b, 0) / leftData.length;
  const avgRight = rightData.reduce((a, b) => a + b, 0) / rightData.length;
  const avgDiff = Math.abs(avgLeft - avgRight);

  const maxDiff = Math.max(...differences.map((d) => d.diff));
  const maxDiffFreq = differences.find((d) => d.diff === maxDiff);

  let summary = '<div class="space-y-3">';
  summary += '<h3 class="text-sm font-semibold text-gray-700">Ear Comparison</h3>';
  summary += '<div class="grid grid-cols-2 gap-3 text-sm">';
  summary += `<div class="bg-blue-50 p-3 rounded-lg">
    <div class="text-xs text-gray-600">Left Ear Average</div>
    <div class="text-lg font-semibold text-blue-700">${avgLeft.toFixed(1)} dB</div>
  </div>`;
  summary += `<div class="bg-blue-50 p-3 rounded-lg">
    <div class="text-xs text-gray-600">Right Ear Average</div>
    <div class="text-lg font-semibold text-blue-700">${avgRight.toFixed(1)} dB</div>
  </div>`;
  summary += '</div>';

  summary += `<div class="bg-gray-50 p-3 rounded-lg text-sm">
    <div class="text-xs text-gray-600 mb-1">Average Difference</div>
    <div class="font-semibold">${avgDiff.toFixed(1)} dB</div>
  </div>`;

  if (maxDiffFreq) {
    summary += `<div class="bg-yellow-50 p-3 rounded-lg text-sm">
      <div class="text-xs text-gray-600 mb-1">Largest Difference</div>
      <div class="font-semibold">${maxDiff.toFixed(1)} dB at ${maxDiffFreq.freq} Hz</div>
    </div>`;
  }

  summary += '</div>';
  return summary;
}

export function updateChartsFromMeasured(
  leftMeasured: HearingResult[],
  rightMeasured: HearingResult[],
  targetFreqs: number[],
  smoothingIntensity: number = 0
) {
  const labels = targetFreqs.map((f) => `${f} Hz`);
  const leftDataRaw = leftMeasured.map(r => r.thresholdDb);
  const rightDataRaw = rightMeasured.map(r => r.thresholdDb);

  // Apply smoothing based on intensity parameter
  const leftData = applySmoothingToData(leftDataRaw, smoothingIntensity);
  const rightData = applySmoothingToData(rightDataRaw, smoothingIntensity);

  // Calculate unified scale for both charts
  const { min, max } = calculateDynamicRange(leftData, rightData);
  const zones = createRelativeZones(min, max);

  if (leftChart && leftData.length > 0) {
    console.log("Updating left chart", JSON.stringify(leftData));
    leftChart.data.labels = labels;
    leftChart.data.datasets[0].data = leftData;
    leftChart.options.scales.y.min = min;
    leftChart.options.scales.y.max = max;
    (leftChart.config as any)._backgroundZones = zones;
    leftChart.update();
  }

  if (rightChart && rightData.length > 0) {
    console.log("Updating right chart", JSON.stringify(rightData));
    rightChart.data.labels = labels;
    rightChart.data.datasets[0].data = rightData;
    rightChart.options.scales.y.min = min;
    rightChart.options.scales.y.max = max;
    (rightChart.config as any)._backgroundZones = zones;
    rightChart.update();
  }

  // Update summary section
  const summaryElement = document.getElementById("result-summary");
  if (summaryElement) {
    summaryElement.innerHTML = generateComparisonSummary(leftData, rightData, targetFreqs);
  }
}