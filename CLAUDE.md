# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based hearing test application that measures hearing sensitivity across different frequencies for each ear separately. It uses the Web Audio API to generate pure tones with controlled volume ramping and measures user response thresholds.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (compiles TypeScript and bundles)
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Components

**HearingTestController** (`src/HearingTestController.ts`)
- Main controller managing the test flow
- Tracks test progress through frequency list
- Records user responses as `HearingResult[]`
- Key configuration: `rampDuration`, `maxGain`, `stepTimeout`, `rampPower`
- Custom event handlers: `nextEventCustomHandler` and `testFinishedCustomHandler` must be set by UI code

**ToneGenerator** (`src/toneGenerator.ts`)
- Web Audio API wrapper for generating pure tones
- Handles stereo channel routing (left/right ear)
- Implements perceptual volume ramping using power curves (`rampPower` parameter)
- Uses `setValueCurveAtTime` for smooth, controlled fade-in to avoid startling the user
- Graceful cleanup prevents audio artifacts when stopping tones

**Charts** (`src/charts.ts`)
- Uses Chart.js to display threshold measurements
- **Dynamic scaling**: automatically adjusts y-axis range to fit any data, ensuring all results are visible
- **Unified scale**: both ears use the same min/max range for direct visual comparison
- **Relative zones**: background colors divide the range into thirds (best/middle/worst)
- **Comparison summary**: shows average thresholds, differences, and largest deviation between ears
- No calibration required - works universally with any equipment

### Data Flow

1. User starts test via UI (`main.ts`)
2. `HearingTestController.start()` initializes audio and begins first frequency
3. For each frequency:
   - `ToneGenerator.start()` plays tone with ramping volume
   - User clicks "I hear it" or timeout expires
   - `HearingTestController.record()` saves raw threshold (dB) and moves to next frequency
4. When all frequencies tested, `testFinishedCustomHandler()` triggers
5. UI calls `updateChartsFromMeasured()` which:
   - Calculates dynamic y-axis range from actual data
   - Ensures both charts use identical scale for comparison
   - Generates background zones relative to the data
   - Displays comparison summary with averages and differences

### Key Behavioral Details

- **Volume Ramping**: Uses power curves (default `rampPower=3.0`) to create slow-start perception. Higher power = slower initial increase, giving users more reaction time before sound becomes loud.
- **Stereo Routing**: Uses `ChannelMergerNode` to send audio to only the selected ear (left or right channel).
- **No Audio Clicks**: Fade-in/fade-out implemented with `setValueCurveAtTime` and `linearRampToValueAtTime` to prevent pops/clicks.
- **Threshold Recording**: When user responds, current gain is captured via `getCurrentGain()` and converted to dB: `20 * Math.log10(gain)`.

## TypeScript Configuration

- Target: ES2022
- Strict mode enabled
- Uses Vite bundler with `moduleResolution: "bundler"`
- Type checking via `tsc` (no emit, Vite handles bundling)

## Key Dependencies

- **Vite**: Build tool and dev server
- **Chart.js**: Rendering audiogram charts
- **Tailwind CSS v4**: Styling via `@tailwindcss/vite` plugin
- **TypeScript ~5.9.3**: Type checking

## Important Notes

- This is an experimental tool, not a medical device
- **No calibration required**: uses relative measurements, works with any equipment
- Primary purpose: compare left vs right ear sensitivity for the same person
- Charts dynamically scale to always show results, regardless of hardware
- Results cannot be compared between different people or different equipment

## Key Features for Universal Use

- **Dynamic Y-Axis Scaling**: Automatically adjusts chart range based on actual measurements
- **Unified Scale**: Both ear charts use the same min/max for direct comparison
- **Relative Zones**: Color bands adapt to the data range (top third = best, bottom third = worst)
- **Comparison Summary**: Shows quantitative differences between ears with averages and largest deviation
- **Always Visible**: 20% padding ensures all data points are clearly visible
