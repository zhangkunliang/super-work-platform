import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "./App"

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"

describe("Velorah hero", () => {
  it("presents the brand, message, and primary actions", () => {
    render(<App />)

    expect(screen.getByText("Velorah", { exact: false })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "Where dreams rise through the silence.",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/We're designing tools for deep thinkers/),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "Begin Journey" }),
    ).toHaveLength(2)
  })

  it("uses the supplied video as an ambient looping background", () => {
    const { container } = render(<App />)
    const video = container.querySelector("video")
    const source = container.querySelector("video source")

    expect(video).not.toBeNull()
    expect(video).toHaveProperty("autoplay", true)
    expect(video).toHaveProperty("loop", true)
    expect(video).toHaveProperty("muted", true)
    expect(video).toHaveProperty("playsInline", true)
    expect(source).toHaveAttribute("src", videoUrl)
    expect(source).toHaveAttribute("type", "video/mp4")
  })
})
