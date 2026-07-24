import { Divider } from '@heroui/react';

export default function AppIntro() {
  return (
    <div data-testid="AppIntro">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Color Scale Generator</h1>
        <p className="text-foreground-500">
          Perceptual, wide-gamut OKLCH color palettes for UI, with WCAG & APCA contrast checks.
        </p>
        <p className="text-foreground-500">Exports to Tailwind, CSS and other formats.</p>
      </div>
      <Divider />
    </div>
  );
}
