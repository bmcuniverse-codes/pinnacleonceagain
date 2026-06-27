export default function Card({ children, className = '' }) {
  return (
    <div className={`soft-card rounded-[2rem] p-6 ${className}`}>
      {children}
    </div>
  )
}