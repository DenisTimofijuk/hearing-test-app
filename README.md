# Hearing Test App

A web-based hearing sensitivity test that measures your hearing thresholds across different frequencies for each ear separately. Built with TypeScript, Web Audio API, and Chart.js.

## Demo

**[Try it live on GitHub Pages](https://denistimofijuk.github.io/hearing-test-app/)**

## Features

- **Separate ear testing** - Test left and right ears independently
- **Wide frequency range** - Tests hearing across multiple frequencies
- **Smooth volume ramping** - Gradual volume increase to avoid startling the user
- **Real-time visualization** - Interactive charts with dynamic scaling
- **Adaptive result smoothing** - Adjustable smoothing to reduce reaction-time variability
- **Comparison analysis** - Side-by-side comparison with quantitative differences
- **No calibration required** - Works with any audio equipment for relative measurements
- **Browser-based** - No installation needed, runs entirely in your browser

## How It Works

1. **Select an ear** to test (left or right)
2. **Start the test** - The app will play pure tones at different frequencies
3. **Listen carefully** - Each tone starts silent and gradually increases in volume
4. **Click "I Hear It"** as soon as you perceive the sound
5. **View results** - Charts show your hearing sensitivity across frequencies
6. **Compare** - Test both ears and compare the results

## Screenshots

The app features a clean, modern interface with:
- Ear selection controls
- Real-time frequency display
- Progress tracking
- Interactive result charts with dynamic scaling
- Comparison summary between ears

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/hearing-test-app.git

# Navigate to the project directory
cd hearing-test-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

## Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Project Structure

```
hearing-test-app/
├── src/
│   ├── HearingTestController.ts   # Main test controller
│   ├── toneGenerator.ts            # Web Audio API wrapper
│   ├── charts.ts                   # Chart.js visualization
│   ├── main.ts                     # UI initialization
│   └── style.css                   # Tailwind styles
├── index.html                      # Main HTML file
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite bundler config
└── CLAUDE.md                       # Development guidelines
```

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Web Audio API** - Pure tone generation and audio routing
- **Chart.js** - Interactive data visualization
- **Tailwind CSS v4** - Utility-first CSS framework

## Key Technical Features

### Audio Generation

- Uses `OscillatorNode` for pure sine wave generation
- `ChannelMergerNode` for stereo channel routing (left/right ear)
- Perceptual volume ramping with power curves for natural perception
- Smooth fade-in/fade-out to prevent audio clicks and pops

### Dynamic Chart Scaling

- Automatically adjusts y-axis range to fit any data
- Unified scale for both ears enables direct visual comparison
- Background zones divide the range into relative performance bands
- 20% padding ensures all data points are clearly visible

### Threshold Recording

- Captures current gain when user responds
- Converts to decibels: `20 * Math.log10(gain)`
- Stores raw measurements for accurate analysis

## Important Disclaimers

**This is NOT a medical device or diagnostic tool.**

### Limitations

- Results are **relative measurements** specific to your equipment
- **Cannot be compared** between different people using different hardware
- Affected by many variables:
  - Headphones or speakers quality and frequency response
  - Sound card / DAC characteristics
  - Browser and operating system audio processing
  - Ambient noise levels
  - User reaction time and attention

### Intended Use

- **Personal experimentation only**
- Compare your **left vs right ear** on the same setup
- Identify potential asymmetries in hearing sensitivity
- Educational purposes and learning about hearing

### Medical Advice

If you have concerns about your hearing, consult a qualified audiologist or hearing professional for a proper diagnostic test.

## Best Practices for Testing

1. **Use headphones** (strongly recommended)
2. **Sit in a quiet environment** with minimal background noise
3. **Set comfortable system volume** (do not use maximum volume)
4. **Respond as soon as you hear the tone** - not when it becomes loud
5. **Take breaks** between tests to avoid ear fatigue
6. **Test at the same time of day** for consistent conditions

## Deploying to GitHub Pages

To deploy this app to GitHub Pages:

1. Update `vite.config.ts` with your repository name:

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/hearing-test-app/', // Replace with your repo name
  plugins: [
    tailwindcss(),
  ],
})
```

2. Build the project:

```bash
npm run build
```

3. Deploy the `dist` folder to GitHub Pages:

```bash
# Using gh-pages package (install first: npm install -D gh-pages)
npx gh-pages -d dist

# Or manually push the dist folder to the gh-pages branch
```

4. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Select "Deploy from a branch"
   - Choose the `gh-pages` branch
   - Save

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow the existing code style (TypeScript strict mode)
- Test thoroughly with different audio equipment
- Update documentation for any new features
- Keep the UI simple and accessible

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with the Web Audio API
- Charts powered by Chart.js
- UI styled with Tailwind CSS
- Developed with Claude Code

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the [CLAUDE.md](CLAUDE.md) file for technical details

---

**Remember:** This is an experimental tool for personal use only, not a substitute for professional hearing evaluation.
