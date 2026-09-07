export type FireworkParticle = {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  lifetime: number
  radius: number
  color: string
  glow: boolean
}

export const MAX_PARTICLES = 640

export type FireworkBurstParticle = FireworkParticle & { kind: "burst" }
export type FireworkLaunchParticle = FireworkParticle & { kind: "launch"; burstAt: number }
export type FireworkParticleState = FireworkBurstParticle | FireworkLaunchParticle

export type FireworkRenderStyle = {
  alphaMultiplier: number
  lineWidthMultiplier: number
  shadowBlur: number
  trailLength: number
}

const PARTICLES_PER_BURST = 84
const BURST_GRAVITY = 0.00008
const BURST_DRAG = 0.99935
const LAUNCH_GRAVITY = 0.00032
const LAUNCH_DRAG = 0.9992

function createBaseBurstParticle(
  x: number,
  y: number,
  index: number,
  random: () => number,
): FireworkBurstParticle {
  const angle = (index / PARTICLES_PER_BURST) * Math.PI * 2 + (random() - 0.5) * 0.08
  const speed = 0.06 + random() * 0.1
  const burstHue = 328 + (index % 5) * 4 + (random() - 0.5) * 4
  const lightness = 76 + random() * 12

  return {
    kind: "burst",
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0,
    lifetime: 1200 + random() * 1400,
    radius: 1.05 + random() * 1.25,
    color: `hsl(${burstHue} 100% ${lightness}%)`,
    glow: index % 4 !== 1,
  }
}

export function advanceFireworkParticle(particle: FireworkParticle, elapsed: number) {
  particle.x += particle.vx * elapsed
  particle.y += particle.vy * elapsed
  particle.vy += BURST_GRAVITY * elapsed
  particle.vx *= BURST_DRAG
  particle.vy *= BURST_DRAG
}

export function createFireworkBurst(
  x: number,
  y: number,
  random = Math.random,
): FireworkBurstParticle[] {
  return Array.from({ length: PARTICLES_PER_BURST }, (_, index) =>
    createBaseBurstParticle(x, y, index, random),
  )
}

export function createFireworkLaunch(
  x: number,
  y: number,
  random = Math.random,
): FireworkLaunchParticle {
  const angle = -Math.PI / 2 + (random() - 0.5) * 0.26
  const speed = 0.22 + random() * 0.1
  const hue = Math.floor(random() * 360)

  return {
    kind: "launch",
    x,
    y,
    vx: Math.cos(angle) * (0.05 + random() * 0.08),
    vy: -speed,
    age: 0,
    lifetime: 900 + random() * 360,
    burstAt: 640 + random() * 180,
    radius: 0.95 + random() * 0.28,
    color: `hsl(${hue} 100% ${90 + random() * 6}%)`,
    glow: true,
  }
}

export function getFireworkRenderStyle(particle: FireworkParticleState): FireworkRenderStyle {
  if (particle.kind === "launch") {
    return {
      alphaMultiplier: 1.08,
      lineWidthMultiplier: 1.18,
      shadowBlur: 34,
      trailLength: Math.min(88, 42 + particle.age * 0.065),
    }
  }

  return {
    alphaMultiplier: 0.78,
    lineWidthMultiplier: 0.92,
    shadowBlur: 16,
    trailLength: Math.min(14, 3 + particle.age * 0.018),
  }
}

export function stepFireworkParticles(
  particles: FireworkParticleState[],
  elapsed: number,
  random = Math.random,
) {
  const spawned: FireworkParticleState[] = []
  const removed: FireworkParticleState[] = []

  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index]
    particle.age += elapsed

    if (particle.kind === "launch") {
      particle.x += particle.vx * elapsed
      particle.y += particle.vy * elapsed
      particle.vy += LAUNCH_GRAVITY * elapsed
      particle.vx *= LAUNCH_DRAG
      particle.vy *= LAUNCH_DRAG

      if (particle.age >= particle.burstAt || particle.vy >= -0.01) {
        removed.push(particle)
        particles.splice(index, 1)
        const burst = createFireworkBurst(particle.x, particle.y, random)
        spawned.push(...burst)
      }
      continue
    }

    if (particle.age >= particle.lifetime) {
      removed.push(particle)
      particles.splice(index, 1)
      continue
    }

    advanceFireworkParticle(particle, elapsed)
  }

  return { spawned, removed }
}
