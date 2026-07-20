import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const POINTS = [
  'Quickly migrate your existing portfolio onto the EliteQuantFin platform.',
  'Get personalised trade recommendations based on years of historical market data, powered by our analytics model.',
  'Continue to grow your portfolio with access to unique and emerging markets and instruments, including crypto.',
]

export function BuiltWithTradersSection() {
  const navigate = useNavigate()

  return (
    <section className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — copy */}
        <Reveal direction="right">
          <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
            A Strong Trading Platform Is Built With Great Traders
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-6 leading-relaxed">
            The best trading platforms are always evolving to bring on new traders who can drive growth.
            We help you access the markets and tools that enable you to meet and exceed your goals.
          </p>

          <p className="text-hero-heading text-base sm:text-lg font-semibold mt-8 mb-4">
            Here&rsquo;s How We Help Traders and Investors:
          </p>
          <ul className="flex flex-col gap-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/10">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
                <span className="text-muted-foreground text-sm sm:text-base leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Button variant="hero" onClick={() => navigate('/register')}>
              Get Started <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2.5} />
            </Button>
          </div>
        </Reveal>

        {/* Right — decorative highlight panel */}
        <Reveal direction="left" delay={120}>
          <div className={cn('liquid-glass rounded-3xl p-8 sm:p-12 flex flex-col gap-8')}>
            <div>
              <p className="text-hero-heading text-5xl sm:text-6xl font-semibold tracking-tight">150+</p>
              <p className="text-muted-foreground text-sm mt-2">Countries with active traders</p>
            </div>
            <div className="border-t border-border/50 pt-8">
              <p className="text-hero-heading text-5xl sm:text-6xl font-semibold tracking-tight">&lt;1ms</p>
              <p className="text-muted-foreground text-sm mt-2">Average order execution speed</p>
            </div>
            <div className="border-t border-border/50 pt-8">
              <p className="text-hero-heading text-5xl sm:text-6xl font-semibold tracking-tight">24/7</p>
              <p className="text-muted-foreground text-sm mt-2">Support and market access</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
