import { Button } from "@/components/ui/button"

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"

const navigation = ["Home", "Studio", "About", "Journal", "Reach Us"]

function JourneyButton({ hero = false }: { hero?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={`liquid-glass rounded-full text-foreground hover:scale-[1.03] hover:bg-transparent ${
        hero
          ? "mt-12 h-auto px-14 py-5 text-base animate-fade-rise-delay-2"
          : "h-auto px-6 py-2.5 text-sm"
      }`}
    >
      Begin Journey
    </Button>
  )
}

export default function App() {
  return (
    <main className="relative isolate flex min-h-svh overflow-hidden bg-background text-foreground">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support background video.
      </video>

      <div className="relative z-10 flex min-h-svh w-full flex-col">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8"
        >
          <a
            href="#"
            className="text-3xl tracking-tight text-foreground"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Velorah<sup className="text-xs">®</sup>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navigation.map((item, index) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                aria-current={index === 0 ? "page" : undefined}
                className={`text-sm transition-colors ${
                  index === 0
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </a>
            ))}
          </div>

          <JourneyButton />
        </nav>

        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-[90px] text-center">
          <h1
            className="max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-foreground text-balance animate-fade-rise sm:text-7xl md:text-8xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Where <span className="text-muted-foreground">dreams</span> rise
            <br className="hidden sm:block" />{" "}
            <span className="text-muted-foreground">
              through the silence.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground animate-fade-rise-delay sm:text-lg">
            We&apos;re designing tools for deep thinkers, bold creators, and
            quiet rebels. Amid the chaos, we build digital spaces for sharp
            focus and inspired work.
          </p>

          <JourneyButton hero />
        </section>
      </div>
    </main>
  )
}
