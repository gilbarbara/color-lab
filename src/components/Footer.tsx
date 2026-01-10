import Contact from '~/components/Contact';

export default function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 p-4" data-uid="Footer">
      <Contact />
      <span className="text-foreground-500">·</span>
      <a href="https://x.com/gilbarbara" rel="noopener noreferrer" target="_blank">
        @gilbarbara
      </a>
      <span className="text-foreground-500">·</span>
      <a href="https://github.com/gilbarbara/colorizr" rel="noopener noreferrer" target="_blank">
        colorizr
      </a>
    </footer>
  );
}
