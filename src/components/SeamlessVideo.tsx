import { useCallback, useEffect, useRef, useState } from "react"

type SeamlessVideoProps = {
  src: string
  className?: string
}

type VideoState = "loading" | "playing" | "error"

type WeixinJSBridge = {
  invoke?: (method: string, params: object, callback: () => void) => void
}

export function SeamlessVideo({ src, className = "" }: SeamlessVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoState, setVideoState] = useState<VideoState>("loading")

  const attemptPlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true
    try {
      const playPromise = video.play()
      void playPromise?.catch(() => undefined)
    } catch {
      // A touch or visibility change can retry playback later.
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    const attemptPlaybackThroughWeChat = () => {
      const bridge = (window as Window & { WeixinJSBridge?: WeixinJSBridge }).WeixinJSBridge
      if (!bridge?.invoke) {
        attemptPlayback()
        return
      }

      try {
        bridge.invoke("getNetworkType", {}, attemptPlayback)
      } catch {
        attemptPlayback()
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") attemptPlayback()
    }

    attemptPlayback()
    if ((window as Window & { WeixinJSBridge?: WeixinJSBridge }).WeixinJSBridge) {
      attemptPlaybackThroughWeChat()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("WeixinJSBridgeReady", attemptPlaybackThroughWeChat)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("WeixinJSBridgeReady", attemptPlaybackThroughWeChat)
      video?.pause()
    }
  }, [attemptPlayback])

  useEffect(() => {
    if (videoState !== "loading") return

    const retryPlayback = () => attemptPlayback()
    document.addEventListener("touchstart", retryPlayback, { passive: true, once: true })
    return () => {
      document.removeEventListener("touchstart", retryPlayback)
    }
  }, [attemptPlayback, videoState])

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden bg-background"
      data-testid="video-background"
      data-video-state={videoState}
    >
      <video
        ref={(video) => {
          videoRef.current = video
          if (!video) return
          video.defaultMuted = true
          video.setAttribute("webkit-playsinline", "true")
          video.setAttribute("x5-playsinline", "true")
          video.setAttribute("x5-video-player-type", "h5-page")
          video.setAttribute("x5-video-player-fullscreen", "false")
        }}
        aria-hidden="true"
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        controls={false}
        data-testid="seamless-video"
        disablePictureInPicture
        loop
        muted
        onCanPlay={attemptPlayback}
        onError={() => setVideoState("error")}
        onLoadedData={attemptPlayback}
        onPlaying={() => setVideoState("playing")}
        playsInline
        preload="auto"
        style={{
          opacity: videoState === "playing" ? 1 : 0,
          transition: "opacity 500ms ease-out",
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  )
}
