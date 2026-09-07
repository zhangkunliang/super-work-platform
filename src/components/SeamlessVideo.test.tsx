import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SeamlessVideo } from "./SeamlessVideo"

const videoUrl = "https://example.com/velorah.mp4"

describe("SeamlessVideo", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("uses one lightweight inline video with Android WebView compatibility attributes", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)

    render(<SeamlessVideo src={videoUrl} />)

    const video = screen.getByTestId("seamless-video") as HTMLVideoElement
    expect(screen.getAllByTestId("seamless-video")).toHaveLength(1)
    expect(video).toHaveProperty("autoplay", true)
    expect(video).toHaveProperty("muted", true)
    expect(video).toHaveProperty("defaultMuted", true)
    expect(video).toHaveProperty("loop", true)
    expect(video).toHaveProperty("playsInline", true)
    expect(video).toHaveAttribute("webkit-playsinline", "true")
    expect(video).toHaveAttribute("x5-playsinline", "true")
    expect(video).toHaveAttribute("x5-video-player-type", "h5-page")
    expect(video).toHaveAttribute("x5-video-player-fullscreen", "false")
  })

  it("retries playback on the first touch when autoplay is blocked", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new DOMException("autoplay blocked", "NotAllowedError"))
      .mockResolvedValue(undefined)

    render(<SeamlessVideo src={videoUrl} />)
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    fireEvent.touchStart(document)

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
  })

  it("retries playback when the page becomes visible again", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    render(<SeamlessVideo src={videoUrl} />)
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    const visibilityState = Object.getOwnPropertyDescriptor(document, "visibilityState")
    try {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" })
      fireEvent(document, new Event("visibilitychange"))

      await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
    } finally {
      if (visibilityState) Object.defineProperty(document, "visibilityState", visibilityState)
      else Reflect.deleteProperty(document, "visibilityState")
    }
  })

  it("retries playback when the WeChat JS bridge becomes ready", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    render(<SeamlessVideo src={videoUrl} />)
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    fireEvent(document, new Event("WeixinJSBridgeReady"))

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
  })

  it("uses an already-ready WeChat JS bridge to start playback", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    const invoke = vi.fn((_method: string, _params: object, callback: () => void) => callback())
    vi.stubGlobal("WeixinJSBridge", { invoke })

    render(<SeamlessVideo src={videoUrl} />)

    await waitFor(() => expect(invoke).toHaveBeenCalledWith("getNetworkType", {}, expect.any(Function)))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
  })

  it.each(["loadedData", "canPlay"])("retries playback on the %s media event", async (eventName) => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    render(<SeamlessVideo src={videoUrl} />)
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    fireEvent[eventName as "loadedData" | "canPlay"](screen.getByTestId("seamless-video"))

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
  })

  it("pauses the mounted video when unmounted", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    const pause = vi.mocked(HTMLMediaElement.prototype.pause)
    const { unmount } = render(<SeamlessVideo src={videoUrl} />)

    unmount()

    expect(pause).toHaveBeenCalledTimes(1)
  })

  it("keeps a stable background and hides a failed video", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("unsupported media"))
    render(<SeamlessVideo src={videoUrl} />)

    const video = screen.getByTestId("seamless-video")
    fireEvent.error(video)

    expect(screen.getByTestId("video-background")).toHaveAttribute("data-video-state", "error")
    expect(video).toHaveStyle({ opacity: "0" })
  })

  it("reveals the video only after the browser starts playback", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
    render(<SeamlessVideo src={videoUrl} />)

    const video = screen.getByTestId("seamless-video")
    expect(video).toHaveStyle({ opacity: "0" })

    fireEvent.playing(video)

    expect(screen.getByTestId("video-background")).toHaveAttribute("data-video-state", "playing")
    expect(video).toHaveStyle({ opacity: "1" })
  })
})
