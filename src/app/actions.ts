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

  if (typeof rawData !== 'string' || !rawData) {
    return { success: false, error: 'Pitch duration data is required.' };
  }

  const parseResult = parsePitchDurationDataString(rawData);

  if ('error' in parseResult) {
    return { success: false, error: parseResult.error };
  }

  const parsedData = parseResult as ParsedData;

  try {
    const base64Midi = generateMidiFromParsedData(parsedData);
    if (base64Midi) {
      return {
        success: true,
        data: base64Midi,
        fileName: `composed_${new Date().toISOString().replace(/[:.]/g, '-')}.mid`,
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
