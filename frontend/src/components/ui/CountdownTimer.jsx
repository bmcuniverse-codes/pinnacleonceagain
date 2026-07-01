import { useEffect, useMemo, useState } from 'react'
import { Clock3 } from 'lucide-react'

function getRemainingParts(targetTime) {
  const total = Math.max(0, targetTime - Date.now())
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((total / (1000 * 60)) % 60)
  const seconds = Math.floor((total / 1000) % 60)

  return { days, hours, minutes, seconds }
}

export function getVotingStatus(event) {
  if (!event) return 'Loading'
  if (event.voting_open === false) return 'Voting Closed'

  const now = Date.now()
  const startsAt = event.voting_starts_at ? new Date(event.voting_starts_at).getTime() : null
  const endsAt = event.voting_ends_at ? new Date(event.voting_ends_at).getTime() : null

  if (startsAt && now < startsAt) return 'Not Started'
  if (endsAt && now > endsAt) return 'Voting Closed'

  return 'Voting Open'
}

export function canVote(event) {
  return getVotingStatus(event) === 'Voting Open'
}

export default function CountdownTimer({ event, compact = false }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const details = useMemo(() => {
    if (!event) {
      return {
        label: 'Loading voting timer',
        tone: 'blue',
        target: null,
      }
    }

    if (event.voting_open === false) {
      return {
        label: 'Voting Closed',
        tone: 'red',
        target: null,
      }
    }

    const startsAt = event.voting_starts_at ? new Date(event.voting_starts_at).getTime() : null
    const endsAt = event.voting_ends_at ? new Date(event.voting_ends_at).getTime() : null

    if (startsAt && now < startsAt) {
      return {
        label: 'Voting starts in',
        tone: 'gold',
        target: startsAt,
      }
    }

    if (endsAt && now <= endsAt) {
      return {
        label: 'Voting closes in',
        tone: 'red',
        target: endsAt,
      }
    }

    if (endsAt && now > endsAt) {
      return {
        label: 'Voting Closed',
        tone: 'red',
        target: null,
      }
    }

    return {
      label: 'Voting is currently open',
      tone: 'red',
      target: null,
    }
  }, [event, now])

  const parts = details.target ? getRemainingParts(details.target) : null

  const toneClasses = {
    green: 'bg-green-50 border-green-100 text-green-700 dark:bg-green-400/10 dark:border-green-400/20 dark:text-green-300',
    gold: 'bg-yellow-50 border-yellow-100 text-yellow-700 dark:bg-yellow-400/10 dark:border-yellow-400/20 dark:text-yellow-300',
    red: 'bg-red-50 border-red-100 text-red-700 dark:bg-red-400/10 dark:border-red-400/20 dark:text-red-300',
    blue: 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-400/10 dark:border-blue-400/20 dark:text-blue-300',
  }

  return (
    <div className={`rounded-[1.5rem] border p-4 sm:p-5 ${toneClasses[details.tone] || toneClasses.blue}`}>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-white/70 dark:bg-white/10 grid place-items-center shrink-0">
          <Clock3 size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em]">
            Voting Timer
          </p>
          <h3 className={`${compact ? 'text-lg' : 'text-xl sm:text-2xl'} font-black break-words`}>
            {details.label}
          </h3>
        </div>
      </div>

      {parts && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
          {[
            ['Days', parts.days],
            ['Hours', parts.hours],
            ['Minutes', parts.minutes],
            ['Seconds', parts.seconds],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white/80 dark:bg-white/10 p-3 text-center">
              <p className="text-xl sm:text-2xl font-black tabular-nums">
                {String(value).padStart(2, '0')}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-black uppercase tracking-wide opacity-80">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
