
"use server";

import { parsePitchDurationDataString, generateMidiFromParsedData, ParsedData } from '@/lib/midi-utils';

interface ActionResult {
  success: boolean;
  data?: string; // Base64 MIDI data
  fileName?: string;
  error?: string;
}

export async function createMidiFileAction(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const rawData = formData.get('pitchDurationData');
  const rawTempo = formData.get('tempo');

  if (typeof rawData !== 'string' || !rawData) {
    return { success: false, error: 'Pitch duration data is required.' };
  }

  let tempo = 120; // Default tempo

  if (typeof rawTempo === 'string' && rawTempo.trim() !== '') {
    const parsedTempo = parseInt(rawTempo, 10);
    if (!isNaN(parsedTempo) && parsedTempo >= 30 && parsedTempo <= 300) {
      tempo = parsedTempo;
    } else {
      return { success: false, error: 'Invalid tempo value. Must be a number between 30 and 300.' };
    }
  } else {
      // This case handles if rawTempo is null, undefined, or an empty/whitespace string
      return { success: false, error: 'Tempo is required and must be a number between 30 and 300.' };
  }


  const parseResult = parsePitchDurationDataString(rawData);

  if ('error' in parseResult) {
    return { success: false, error: parseResult.error };
  }

  const parsedData = parseResult as ParsedData;

  try {
    const base64Midi = generateMidiFromParsedData(parsedData, tempo);
    if (base64Midi) {
      return {
        success: true,
        data: base64Midi,
        fileName: `composed_tempo_${tempo}_${new Date().toISOString().replace(/[:.]/g, '-')}.mid`,
      };
    } else {
      return { success: false, error: 'Failed to generate MIDI data.' };
    }
  } catch (e) {
    const error = e as Error;
    console.error("MIDI Generation Error:", error);
    return { success: false, error: `Error during MIDI generation: ${error.message}` };
  }
}
