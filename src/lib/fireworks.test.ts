import { describe, expect, it } from "vitest"

import {
  advanceFireworkParticle,
  createFireworkBurst,
  createFireworkLaunch,
  getFireworkRenderStyle,
  stepFireworkParticles,
} from "./fireworks"

describe("createFireworkBurst", () => {
  it("creates a colorful burst with bounded long-lived particles", () => {
    const particles = createFireworkBurst(320, 240, () => 0.5)

    expect(particles.length).toBeGreaterThanOrEqual(80)
    expect(particles.every((particle) => particle.x === 320 && particle.y === 240)).toBe(true)
    expect(particles.every((particle) => particle.lifetime >= 1200 && particle.lifetime <= 2600)).toBe(true)
    expect(particles.every((particle) => particle.color.startsWith("hsl("))).toBe(true)
  })

  it("keeps the burst compact and airy", () => {
    const particles = createFireworkBurst(320, 240, () => 0.5)
    const maxHorizontalSpeed = Math.max(...particles.map((particle) => Math.abs(particle.vx)))
    const maxVerticalSpeed = Math.max(...particles.map((particle) => Math.abs(particle.vy)))

    expect(maxHorizontalSpeed).toBeLessThanOrEqual(0.22)
    expect(maxVerticalSpeed).toBeLessThanOrEqual(0.22)
  })

  it("drifts downward gently over time", () => {
    const particle = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      age: 0,
      lifetime: 2000,
      radius: 1,
      color: "hsl(0 100% 100%)",
      glow: false,
    }

    advanceFireworkParticle(particle, 1000)

    expect(particle.y).toBeLessThan(160)
    expect(particle.vy).toBeLessThan(0.12)
  })

  it("launches upward before it blooms", () => {
    const rocket = createFireworkLaunch(320, 240, () => 0.5)

    expect(rocket.kind).toBe("launch")
    expect(rocket.vy).toBeLessThan(0)
    expect(Math.abs(rocket.vx)).toBeLessThan(0.08)
  })

  it("spawns a bloom after the launch reaches its apex", () => {
    const rocket = createFireworkLaunch(320, 240, () => 0.5)
    const result = stepFireworkParticles([rocket], 900, () => 0.5)

    expect(result.removed).toContain(rocket)
    expect(result.spawned.length).toBeGreaterThan(0)
    expect(result.spawned.every((particle) => particle.kind === "burst")).toBe(true)
  })

  it("renders the launch as a meteor streak", () => {
    const launch = createFireworkLaunch(320, 240, () => 0.5)
    const burst = createFireworkBurst(320, 240, () => 0.5)[0]

    const launchStyle = getFireworkRenderStyle(launch)
    const burstStyle = getFireworkRenderStyle(burst)

    expect(launchStyle.trailLength).toBeGreaterThanOrEqual(40)
    expect(launchStyle.lineWidthMultiplier).toBeGreaterThanOrEqual(1)
    expect(launchStyle.shadowBlur).toBeGreaterThanOrEqual(30)
    expect(launchStyle.trailLength).toBeGreaterThan(burstStyle.trailLength)
  })

  it("uses a romantic rose palette for the bloom", () => {
    const particles = createFireworkBurst(320, 240, () => 0.5)
    const hue = Number.parseInt(particles[0].color.match(/^hsl\((\d+)/)?.[1] ?? "0", 10)

    expect(hue).toBeGreaterThanOrEqual(320)
    expect(hue).toBeLessThanOrEqual(350)
  })
})
