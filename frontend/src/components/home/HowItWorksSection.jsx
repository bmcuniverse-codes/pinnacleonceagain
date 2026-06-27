import { CreditCard, Trophy, Users, ShieldCheck } from 'lucide-react'
import Section from '../ui/Section'

export default function HowItWorksSection() {
  const steps = [
    [Users, 'Choose event', 'Open the active school event and select a voting category.'],
    [Trophy, 'Pick nominee', 'View nominees, their pictures, nicknames and voting profile.'],
    [CreditCard, 'Pay securely', 'Enter an amount and complete payment through Paystack.'],
    [ShieldCheck, 'Vote counted', 'After confirmation, the vote updates automatically.'],
  ]

  return (
    <Section
      eyebrow="Simple Process"
      title="How voting works"
      description="The voting journey is simple, fast and built for mobile users."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map(([Icon, title, text], index) => (
          <article key={title} className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-2xl bg-blue-800 text-yellow-300 grid place-items-center">
                <Icon size={26} />
              </div>
              <p className="text-4xl font-black text-slate-100 dark:text-white/10">
                {index + 1}
              </p>
            </div>

            <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">
              {title}
            </h3>

            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              {text}
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}