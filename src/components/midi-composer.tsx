
"use client";

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createMidiFileAction } from '@/app/actions';
import { Download, Loader2, Music2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const initialPitchData = `[
  # Phrase 1: "Bl-a! Cl-a! Fl-a!"
  ((60,), (60, 64, 67), (48,), 0.5),  # All together
  ((62,), (0,), (0,), 0.5),          # Melody alone
  ((64,), (60, 64, 67), (0,), 0.5),  # Melody + chords
  ((0,), (0,), (48,), 0.5),          # Bass after pause

  # Phrase 2: "Gr-a! Pl-a! Sl-a!"
  ((65,), (0,), (48,), 0.5),         # Melody + bass
  ((67,), (65, 69, 72), (0,), 0.5),  # Melody + chords
  ((0,), (0,), (50,), 0.5),          # Bass alone
  ((69,), (0,), (0,), 0.5),          # Melody alone

  # Phrase 3: "Sn-a! Sp-a! Bl-a!"
  ((67,), (64, 67, 71), (52,), 0.5),  # All together
  ((0,), (0,), (0,), 0.25),           # Short silence
  ((65,), (0,), (0,), 0.25),          # Melody tag
  ((60,), (0,), (0,), 0.5),           # Melody alone

  # Phrase 4: "Fl-a! Gr-a! Cl-a!"
  ((64,), (60, 64, 67), (0,), 0.5),   # Melody + chords
  ((0,), (0,), (48,), 0.5),           # Bass drop
  ((65,), (0,), (0,), 0.5),           # Melody solo
  ((62,), (60, 64, 67), (0,), 0.5),   # Melody + chords

  # Closing Phrase: "We blend with A!" "We chant all day!"
  ((0,), (67, 71, 74), (55,), 0.5),   # Chord + bass swell
  ((67,), (0,), (0,), 0.5),           # Melody statement
  ((0,), (65, 69, 72), (52,), 0.5),   # Chord + bass
  ((69,), (0,), (0,), 0.5)           # Melody close
]`;

const initialState = {
  success: false,
  data: undefined,
  fileName: undefined,
  error: undefined,
};

export function MidiComposer() {
  const [formState, formAction, isActionPending] = useActionState(createMidiFileAction, initialState);
  const { toast } = useToast();
  const [pitchData, setPitchData] = useState(initialPitchData);

  useEffect(() => {
    if (formState?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: formState.error,
      });
    } else if (formState?.success && formState.data) {
      toast({
        title: 'Success!',
        description: 'MIDI file generated. Click Download to save.',
      });
    }
  }, [formState, toast]);

  const handleDownload = () => {
    if (formState?.data && formState.fileName) {
      try {
        const byteCharacters = atob(formState.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = formState.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Download Error',
            description: 'Could not prepare file for download.',
         });
         console.error("Download error:", e);
      }
    }
  };
  

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="pitchDurationData" className="block text-sm font-medium mb-1">
          Pitch Duration Data
        </label>
        <Textarea
          id="pitchDurationData"
          name="pitchDurationData"
          value={pitchData}
          onChange={(e) => setPitchData(e.target.value)}
          placeholder="Enter your pitch_duration_data here..."
          rows={15}
          className="w-full p-3 border rounded-md shadow-sm bg-background focus:ring-primary focus:border-primary font-mono text-sm"
          required
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Enter data in Python list of tuples format, e.g., <code className="bg-muted p-1 rounded-sm">[((60,), (60,64,67), (48,), 0.5)]</code>. Comments with # are allowed and will be handled by the parser.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <Button type="submit" disabled={isActionPending} className="w-full sm:w-auto">
          {isActionPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Music2 className="mr-2 h-4 w-4" />
              Generate MIDI
            </>
          )}
        </Button>

        {formState?.success && formState?.data && (
          <Button
            type="button"
            onClick={handleDownload}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download MIDI
          </Button>
        )}
      </div>
       {/* Example for data structure reminder, could be part of a help tooltip or a separate section */}
      <Alert variant="default" className="mt-4">
          <AlertTitle className="font-semibold">Data Format Reminder</AlertTitle>
          <AlertDescription className="text-xs">
            Each entry in the list represents a musical moment:
            <ul className="list-disc list-inside pl-2 mt-1">
              <li><code>((melody_pitches), (chord_pitches), (bass_pitches), duration_in_beats)</code></li>
              <li>Pitches are MIDI numbers (e.g., 60 for C4). Use <code>(0,)</code> for silence in a part.</li>
              <li>Example: <code>((60,), (60, 64, 67), (48,), 0.5)</code></li>
            </ul>
          </AlertDescription>
      </Alert>
    </form>
  );
}

