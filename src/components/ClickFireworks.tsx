import { useEffect, useRef } from "react"

import {
  createFireworkLaunch,
  getFireworkRenderStyle,
  MAX_PARTICLES,
  stepFireworkParticles,
  type FireworkParticleState,
} from "@/lib/fireworks"

function supportsReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

export function ClickFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")

    if (!canvas || !context) return

    const particles: FireworkParticleState[] = []
    let animationFrameId = 0
    let previousTime = 0
    let width = 0
    let height = 0

    const clearCanvas = () => {
      context.clearRect(0, 0, width, height)
    }

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      clearCanvas()
    }

    const stopAnimation = () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
        animationFrameId = 0
      }
    }

    const draw = (time: number) => {
      const elapsed = previousTime === 0 ? 0 : Math.min(Math.max(time - previousTime, 0), 34)
      previousTime = time
      clearCanvas()

      const renderParticle = (particle: FireworkParticleState) => {
        const progress = particle.age / particle.lifetime
        const opacity = Math.max(0, 1 - progress * progress)
        const style = getFireworkRenderStyle(particle)

        const drawTrail = (alphaScale: number, widthScale: number) => {
          context.globalAlpha = opacity * alphaScale
          context.lineWidth = particle.radius * widthScale
          context.lineCap = "round"
          context.strokeStyle = particle.color
          context.beginPath()
          context.moveTo(particle.x, particle.y)
          context.lineTo(
            particle.x - particle.vx * style.trailLength,
            particle.y - particle.vy * style.trailLength,
          )
          context.stroke()
        }

        if (particle.kind === "launch") {
          context.shadowBlur = style.shadowBlur
          context.shadowColor = particle.color
          drawTrail(0.24, style.lineWidthMultiplier * 2.1)
          drawTrail(style.alphaMultiplier, style.lineWidthMultiplier)
        } else {
          drawTrail(style.alphaMultiplier, style.lineWidthMultiplier)
        }

        context.globalAlpha = opacity
        if (particle.glow) {
          context.shadowBlur = style.shadowBlur
          context.shadowColor = particle.color
        }
        context.fillStyle = particle.color
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
        context.shadowBlur = 0
      }

      const { spawned } = stepFireworkParticles(particles, elapsed)

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        renderParticle(particles[index])
      }

      spawned.forEach(renderParticle)
      particles.push(...spawned)
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES)
      }

      context.globalAlpha = 1
      if (particles.length > 0) {
        animationFrameId = window.requestAnimationFrame(draw)
      } else {
        animationFrameId = 0
        previousTime = 0
      }
    }

    const startAnimation = () => {
      if (!animationFrameId) {
        previousTime = 0
        animationFrameId = window.requestAnimationFrame(draw)
      }
    }

    const burst = (event: PointerEvent) => {
      if (event.button !== 0 || supportsReducedMotion()) return

      particles.push(createFireworkLaunch(event.clientX, event.clientY))
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES)
      }
      startAnimation()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation()
        particles.length = 0
        previousTime = 0
        clearCanvas()
      }
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("pointerdown", burst)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stopAnimation()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointerdown", burst)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      particles.length = 0
      clearCanvas()
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-20 h-full w-full" aria-hidden="true" />
}
