import { Cog, BarChart3, Globe, Brain, Link2, Rocket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

type Solution = { icon: LucideIcon; title: string; desc: string }

const SOLUTIONS: Solution[] = [
  {
    icon: Cog,
    title: 'Automated Trading Management',
    desc: 'Streamline your trading workflows using our advanced automation tools and dashboards.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Access detailed insights to optimise your positions, track market performance, and grow your returns.',
  },
  {
    icon: Globe,
    title: 'Global Scaling Infrastructure',
    desc: 'Expand across borders with access to global markets and localised trading support.',
  },
  {
    icon: Brain,
    title: 'Expert Strategy Guidance',
    desc: 'Partner with experienced strategists to sharpen your edge and refine your approach.',
  },
  {
    icon: Link2,
    title: 'Seamless Integrations',
    desc: 'Easily connect your stack with our trading platform, APIs, and real-time market data feeds.',
  },
  {
    icon: Rocket,
    title: 'Performance Optimization',
    desc: 'Continuous testing, risk scoring, and portfolio tuning keep you performing at your best.',
  },
]

function SolutionCard({ icon: Icon, title, desc }: Solution) {
  return (
    <div className={cn('liquid-glass rounded-3xl p-8 flex flex-col items-center text-center gap-4 hover:bg-white/[0.03] transition-colors h-full')}>
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.06]">
        <Icon className="w-6 h-6 text-foreground/80" strokeWidth={2} />
      </span>
      <h3 className="text-hero-heading text-lg sm:text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

export function ScalableSolutionsSection() {
  return (
    <section className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
            Scalable Solutions Through<br className="hidden sm:block" /> Technology &amp; Expertise
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            Empower your growth with technology-driven trading strategies and expert support built to scale.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {SOLUTIONS.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 120}>
              <SolutionCard {...s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
