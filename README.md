# Midi Maker

Midi Maker is a simple Next.js application that converts user supplied pitch and duration data into a downloadable MIDI file. The project started from a Firebase Studio starter template and now includes server actions and a small UI built with Tailwind and Radix UI components.

## Features
- Form for entering **pitch duration data** in a Python‑like list of tuples
- Server side validation and MIDI generation using [`midi-writer-js`](https://www.npmjs.com/package/midi-writer-js)
- Example data prefilled in the form and a button to paste from the clipboard
- Download button to save the generated `.mid` file

## Getting Started
Install dependencies and launch the development server:

```bash
npm install
npm run dev
```

The app runs on [http://localhost:9002](http://localhost:9002).

## Project Structure
- `src/app` – Next.js entry point, layout and server actions
- `src/components` – React components including the `MidiComposer`
- `src/lib` – MIDI parsing and generation utilities
- `src/ai` – Genkit configuration for potential AI features
- `docs/blueprint.md` – initial design outline

## Usage
Enter your pitch and duration data in the following format and click **Generate MIDI**:

```text
[
  ((60,), (60, 64, 67), (48,), 0.5),  # Melody + chord + bass
]
```

After generation, use the **Download MIDI** button to save the file.
