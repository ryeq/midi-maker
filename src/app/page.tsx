import { MidiComposer } from '@/components/midi-composer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Midi Composer</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Input your pitch and duration data to generate a MIDI file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MidiComposer />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Midi Composer. Powered by Next.js.</p>
      </footer>
    </main>
  );
}
