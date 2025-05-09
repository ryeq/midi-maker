
import MidiWriter from 'midi-writer-js';

export interface ParsedDataItem {
  melodyPitches: number[];
  chordPitches: number[];
  bassPitches: number[];
  duration: number; // Python duration value
}

export type ParsedData = ParsedDataItem[];

// Function to parse the Python-like string to ParsedData
export function parsePitchDurationDataString(inputString: string): ParsedData | { error: string } {
  if (!inputString || inputString.trim() === '') {
    return { error: 'Input data cannot be empty.' };
  }

  let processString = inputString.trim();

  // Basic validation for overall structure
  if (!processString.startsWith('[') || !processString.endsWith(']')) {
    return { error: 'Data must be a list starting with [ and ending with ].' };
  }

  try {
    // Transform Python-like tuples to JSON-like arrays
    // Replace ( with [, ) with ]
    processString = processString.replace(/\(/g, '[').replace(/\)/g, ']');
    // Remove trailing commas before a closing bracket (e.g., [60,] -> [60])
    // Also handle multiple whitespaces around comma e.g. [60 , ] -> [60]
    processString = processString.replace(/,\s*\]/g, ']');
    // Remove comments (lines starting with #)
    processString = processString.split('\n').map(line => line.replace(/#.*$/, '')).join('\n');
    // Remove empty lines that might result from comment removal
    processString = processString.replace(/^\s*[\r\n]/gm, '');


    const data = JSON.parse(processString);

    if (!Array.isArray(data)) {
      return { error: 'Parsed data is not an array.' };
    }

    const parsedResult: ParsedData = [];
    for (const item of data) {
      if (!Array.isArray(item) || item.length !== 4) {
        return { error: `Each item must be an array of 4 elements. Found: ${JSON.stringify(item)}` };
      }
      const [melody, chord, bass, duration] = item;
      if (!Array.isArray(melody) || !melody.every(n => typeof n === 'number')) {
        return { error: `Melody pitches must be an array of numbers. Found: ${JSON.stringify(melody)}` };
      }
      if (!Array.isArray(chord) || !chord.every(n => typeof n === 'number')) {
        return { error: `Chord pitches must be an array of numbers. Found: ${JSON.stringify(chord)}` };
      }
      if (!Array.isArray(bass) || !bass.every(n => typeof n === 'number')) {
        return { error: `Bass pitches must be an array of numbers. Found: ${JSON.stringify(bass)}` };
      }
      if (typeof duration !== 'number') {
        return { error: `Duration must be a number. Found: ${JSON.stringify(duration)}` };
      }
      parsedResult.push({
        melodyPitches: melody,
        chordPitches: chord,
        bassPitches: bass,
        duration: duration,
      });
    }
    return parsedResult;

  } catch (e) {
    const error = e as Error;
    return { error: `Invalid data format: ${error.message}. Please ensure data is similar to Python list of tuples. Example: [([60], [60,64,67], [48], 0.5)]` };
  }
}

// Function to map Python duration (in beats) to midi-writer-js duration string
function mapDurationToMidiWriter(pythonDuration: number): string {
  if (pythonDuration === 0.125) return '32'; // Thirty-second note
  if (pythonDuration === 0.25) return '16'; // Sixteenth note
  if (pythonDuration === 0.5) return '8';  // Eighth note
  if (pythonDuration === 1.0) return '4';  // Quarter note
  if (pythonDuration === 2.0) return '2';  // Half note
  if (pythonDuration === 4.0) return '1';  // Whole note
  
  // For dotted notes or other durations, midi-writer-js supports an array for duration
  // e.g., ['4', '8'] for a dotted quarter note (quarter + eighth).
  // For simplicity, we'll map common ones.
  // If a duration is not directly mapped, it might need to be represented as ticks.
  // 'T<ticks>' e.g., 'T128' for 128 ticks (a quarter note if TPB is 128).
  // pythonDuration * MidiWriter.constants.TPB could calculate this.
  // For now, we'll default unmapped durations.
  const ticks = pythonDuration * MidiWriter.constants.TPB;
  if (Number.isInteger(ticks) && ticks > 0) {
    return `T${ticks}`;
  }

  console.warn(`Unsupported Python duration: ${pythonDuration}. Defaulting to quarter note equivalent ticks ('T${MidiWriter.constants.TPB}').`);
  return `T${MidiWriter.constants.TPB}`;
}

// Function to generate MIDI
export function generateMidiFromParsedData(parsedData: ParsedData): string { // returns base64 string
  const tempo = 120;
  const instrumentId = 0; // Acoustic Grand Piano
  const volume = 80; // 0-127

  const melodyTrack = new MidiWriter.Track();
  melodyTrack.setTempo(tempo); // Set tempo on the first track
  melodyTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 1 }));

  const chordTrack = new MidiWriter.Track();
  // Tempo is global or set on first track usually. No need to setTempo on other tracks unless it changes.
  chordTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 2 }));

  const bassTrack = new MidiWriter.Track();
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 3 }));
  
  let currentTimeInBeats = 0; 
  const TICKS_PER_BEAT = MidiWriter.constants.TPB; 

  for (const item of parsedData) {
    const midiWriterDuration = mapDurationToMidiWriter(item.duration);
    const absoluteStartTick = Math.round(currentTimeInBeats * TICKS_PER_BEAT);

    const commonNoteParams = {
      duration: midiWriterDuration,
      sequential: false, // Use absolute timing based on 'tick'
      tick: absoluteStartTick,
      velocity: volume,
    };

    const validMelodyPitches = item.melodyPitches.filter(p => p > 0 && p <= 127);
    if (validMelodyPitches.length > 0) {
      melodyTrack.addEvent(
        new MidiWriter.NoteEvent({
          ...commonNoteParams,
          pitch: validMelodyPitches,
          channel: 1, 
        })
      );
    }

    const validChordPitches = item.chordPitches.filter(p => p > 0 && p <= 127);
    if (validChordPitches.length > 0) {
       chordTrack.addEvent(
        new MidiWriter.NoteEvent({
          ...commonNoteParams,
          pitch: validChordPitches,
          channel: 2,
        })
      );
    }

    const validBassPitches = item.bassPitches.filter(p => p > 0 && p <= 127);
    if (validBassPitches.length > 0) {
      bassTrack.addEvent(
        new MidiWriter.NoteEvent({
          ...commonNoteParams,
          pitch: validBassPitches,
          channel: 3,
        })
      );
    }
    currentTimeInBeats += item.duration;
  }
  
  // Instantiate Writer with an array of tracks
  const writer = new MidiWriter.Writer([melodyTrack, chordTrack, bassTrack]);

  const dataUri = writer.dataUri(); // Format: "data:audio/midi;base64,..."
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.includes(',')) {
    console.error('MIDI Writer did not return a valid data URI.');
    throw new Error('Failed to generate MIDI data URI.');
  }
  return dataUri.split(',')[1]; // Extract base64 part
}

