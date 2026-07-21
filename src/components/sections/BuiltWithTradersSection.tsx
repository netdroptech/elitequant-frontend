import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PARTNER_IMAGE =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1100&q=80'

const POINTS = [
  'Quickly migrate current partners into the EliteQuantFin affiliate network.',
  'Get new partner recommendations based on years of historical data, powered by our matchmaking model.',
  'Continue to grow your publisher base with access to unique and emerging partners and channels, including influencers.',
]

export function BuiltWithTradersSection() {
  const navigate = useNavigate()

  return (
    <section className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — copy */}
        <Reveal direction="right">
          <h2 className="text-hero-heading text-3xl sm:text-5xl font-semibold leading-tight">
            A Strong Affiliate Program Is Built With Great Partners
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-6 leading-relaxed">
            The best affiliate programs are always evolving to bring on new partners that can drive growth.
            We help you source partners that enable you to meet and exceed your goals.
          </p>

          <p className="text-hero-heading text-base sm:text-lg font-semibold mt-8 mb-4">
            Here&rsquo;s How We Help Brands and Publishers:
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

        {/* Right — real image */}
        <Reveal direction="left" delay={120}>
          <div className={cn('liquid-glass rounded-3xl p-2 overflow-hidden')}>
            <img
              src={PARTNER_IMAGE}
              alt="Affiliate partners collaborating"
              loading="lazy"
              className="w-full h-full object-cover rounded-[1.35rem] aspect-[4/3]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
