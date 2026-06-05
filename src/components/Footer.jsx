// Footer — app-wide copyright line. Rendered once via the Layout wrapper so it
// appears on every routed page without per-page repetition.
 
function Footer() {
  return (
    <footer className="py-6 text-center text-gray-700 text-xs tracking-wide">
      &copy; 2026{' '}
      <a
        href="https://pinadesign.jp"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-cyan-400 transition-colors"
      >
        pinadesign
      </a>
    </footer>
  )
}
 
export default Footer
 