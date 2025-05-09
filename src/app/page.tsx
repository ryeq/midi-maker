import { MidiComposer } from '@/components/midi-composer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="items-center">
          <Image
            src="https://theworknplay.com/uploads/2022/12/23/20221223145935111469.logo_img.jpg?hash_sha1=d0d6326ffccdf297fd12b677919cef78777ae055"
            alt="CANB Music Maker Logo"
            width={120}
            height={36}
            className="mb-4"
            priority // Preload the logo as it's LCP
          />
          <CardTitle className="text-3xl font-bold text-center">Music Maker</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Input your pitch and duration data to generate a MIDI file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MidiComposer />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CANB Music Maker. Powered by Next.js.</p>
      </footer>
    </main>
  );
}
