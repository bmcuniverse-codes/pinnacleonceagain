export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const styles =
    variant === 'ghost'
      ? 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
      : 'brand-gradient text-white shadow-xl hover:scale-[1.02]'

  return (
    <button
      className={`rounded-full px-6 py-3 font-black transition active:scale-95 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}