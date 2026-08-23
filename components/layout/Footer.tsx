export default function Footer() {
  return (
    <footer className="bg-ink px-5 pb-8 pt-6 text-paper sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-paper/15 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono-label">
          LINKHAUS<span className="text-accent-blue">.</span>
        </div>

        <nav className="font-mono-label flex flex-wrap gap-5 text-paper/50">
          <a href="#work" data-cursor="link" className="hover:text-paper">Work</a>
          <a href="#studio" data-cursor="link" className="hover:text-paper">Studio</a>
          <a href="#services" data-cursor="link" className="hover:text-paper">Services</a>
          <a href="#contact" data-cursor="link" className="hover:text-paper">Contact</a>
        </nav>

        <div className="font-mono-label text-right text-paper/40">
          DESIGNED + DEVELOPED
          <br />
          INDEPENDENTLY &mdash; 2026
        </div>
      </div>
    </footer>
  );
}
