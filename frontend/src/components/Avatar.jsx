import { initials } from '../lib/helpers'
export default function Avatar({ src, name, size = 'h-14 w-14' }) {
  return <div className={`${size} overflow-hidden rounded-full gold-gradient p-[2px] shrink-0`}>
    <div className="h-full w-full rounded-full bg-night grid place-items-center overflow-hidden">
      {src ? <img src={src} alt={name} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-sm font-black text-gold">{initials(name)}</span>}
    </div>
  </div>
}
