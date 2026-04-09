import { Divider } from '@heroui/react';

export default function GeneratorHeader() {
  return (
    <div data-testid="GeneratorHeader">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2">Color Scale Generator</h2>
        <p>Perceptual, wide-gamut color palettes for UI.</p>
        <p>Exports to Tailwind CSS and other formats.</p>
      </div>
      <Divider />
    </div>
  );
}
