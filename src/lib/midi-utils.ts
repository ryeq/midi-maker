
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
    processString = processString.replace(/,\s*\]/g, ']');

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
  
  // Fallback for durations not explicitly mapped, this might not be musically standard.
  // midi-writer-js also accepts 'T<ticks>' e.g. 'T128' for 128 ticks.
  // Assuming 128 ticks per quarter note (beat), pythonDuration * 128 would be the tick count.
  // However, for simplicity and adherence to common musical notation, we'll stick to mapped values
  // and warn for unmapped ones.
  console.warn(`Unsupported Python duration: ${pythonDuration}. Defaulting to quarter note ('4').`);
  return '4';
}

// Function to generate MIDI
export function generateMidiFromParsedData(parsedData: ParsedData): string { // returns base64 string
  const writer = new MidiWriter.Writer(); 

  const tempo = 120;
  const instrumentId = 0; // Acoustic Grand Piano
  const volume = 80; // 0-127

  // Track 0 for Melody (Channel 1 in MIDI)
  const melodyTrack = new MidiWriter.Track();
  melodyTrack.setTempo(tempo);
  melodyTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 1 }));


  // Track 1 for Chords (Channel 2 in MIDI)
  const chordTrack = new MidiWriter.Track();
  chordTrack.setTempo(tempo);
  chordTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 2 }));

  // Track 2 for Bass (Channel 3 in MIDI)
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: instrumentId, channel: 3 }));
  
  let currentTimeInBeats = 0; 
  const TICKS_PER_BEAT = MidiWriter.Constants.TPB; 

  for (const item of parsedData) {
    const midiWriterDuration = mapDurationToMidiWriter(item.duration);
    const startTick = Math.round(currentTimeInBeats * TICKS_PER_BEAT);

    const validMelodyPitches = item.melodyPitches.filter(p => p > 0 && p <= 127);
    if (validMelodyPitches.length > 0) {
      melodyTrack.addEvent(
        new MidiWriter.NoteEvent({
          pitch: validMelodyPitches,
          duration: midiWriterDuration,
          tick: startTick,
          velocity: volume,
          channel: 1, 
        })
      );
    }

    const validChordPitches = item.chordPitches.filter(p => p > 0 && p <= 127);
    if (validChordPitches.length > 0) {
       chordTrack.addEvent(
        new MidiWriter.NoteEvent({
          pitch: validChordPitches,
          duration: midiWriterDuration,
          tick: startTick,
          velocity: volume,
          channel: 2,
        })
      );
    }

    const validBassPitches = item.bassPitches.filter(p => p > 0 && p <= 127);
    if (validBassPitches.length > 0) {
      bassTrack.addEvent(
        new MidiWriter.NoteEvent({
          pitch: validBassPitches,
          duration: midiWriterDuration,
          tick: startTick,
          velocity: volume,
          channel: 3,
        })
      );
    }
    currentTimeInBeats += item.duration;
  }
  
  writer.addTrack(melodyTrack);
  writer.addTrack(chordTrack);
  writer.addTrack(bassTrack);

  const dataUri = writer.dataUri(); // Format: "data:audio/midi;base64,..."
  return dataUri.split(',')[1]; // Extract base64 part
}

