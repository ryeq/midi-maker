
import ActualMidiWriter from 'midi-writer-js';

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
function mapDurationToMidiWriter(pythonDuration: number, TPB: number): string {
  // Prioritize direct mapping for common beat fractions if they match standard note values
  if (TPB === 128) { // Assuming standard TPB where these make sense
    if (pythonDuration === 0.125) return '32';
    if (pythonDuration === 0.25) return '16';
    if (pythonDuration === 0.5) return '8';
    if (pythonDuration === 1.0) return '4';
    if (pythonDuration === 2.0) return '2';
    if (pythonDuration === 4.0) return '1';
  }

  // Fallback to ticks for all other durations or if TPB is non-standard for these mappings
  const ticks = pythonDuration * TPB;
  if (Number.isInteger(ticks) && ticks > 0) {
    return `T${ticks}`;
  }

  // If ticks calculation is problematic (e.g., non-integer, zero, or negative), default to a sensible value.
  // This indicates an issue with either pythonDuration or TPB.
  console.warn(`Unsupported Python duration: ${pythonDuration} or problematic TPB: ${TPB}. Defaulting to quarter note equivalent ticks ('T${TPB}').`);
  return `T${TPB}`; // Default to TPB ticks (equivalent to a quarter note if TPB is per quarter)
}


// Function to generate MIDI
export function generateMidiFromParsedData(parsedData: ParsedData, tempo: number): string { // returns base64 string
  const instrumentId = 0; // Acoustic Grand Piano
  const volume = 80; // 0-127
  
  // midi-writer-js specific: Use its constants if available, otherwise default
  const MidiWriter = (ActualMidiWriter as any).default || ActualMidiWriter;
  const TPB = (MidiWriter.constants && typeof MidiWriter.constants.TPB === 'number') ? MidiWriter.constants.TPB : 128;


  const melodyTrack = new MidiWriter.Track();
  melodyTrack.setTempo(tempo); 
  melodyTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 1 }));

  const chordTrack = new MidiWriter.Track();
  chordTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 2 }));

  const bassTrack = new MidiWriter.Track();
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 3 }));
  
  let currentTimeInBeats = 0; 

  for (const item of parsedData) {
    const midiWriterDuration = mapDurationToMidiWriter(item.duration, TPB);
    const absoluteStartTick = Math.round(currentTimeInBeats * TPB);

    const commonNoteParams = {
      duration: midiWriterDuration,
      sequential: false, 
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
  
  const writer = new MidiWriter.Writer([melodyTrack, chordTrack, bassTrack]);

  const dataUri = writer.dataUri(); 
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.includes(',')) {
    console.error('MIDI Writer did not return a valid data URI.');
    throw new Error('Failed to generate MIDI data URI.');
  }
  return dataUri.split(',')[1]; 
}
