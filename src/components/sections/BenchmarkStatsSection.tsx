import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

const STATS = [
  { value: '25+',     label: 'Years Leading Affiliate' },
  { value: '#1',      label: 'In Global Traffic' },
  { value: '1200M+',  label: 'Consumers Reached' },
  { value: '200M+',   label: 'Transactions Completed' },
]

export function BenchmarkStatsSection() {
  return (
    <section className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center mb-12 sm:mb-16">
          <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight max-w-4xl mx-auto">
            Our Affiliates Consistently Outperform Industry Benchmarks — And We&rsquo;ve Got the Data to Back It Up
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 120}>
              <div className={cn('liquid-glass rounded-3xl p-8 flex flex-col items-center text-center gap-2 hover:bg-white/[0.03] transition-colors h-full')}>
                <p className="text-hero-heading text-4xl sm:text-5xl font-semibold tracking-tight">{s.value}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
