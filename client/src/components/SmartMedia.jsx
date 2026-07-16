import { useEffect, useRef } from "react";

const VIDEO_RE = /\.(mp4|webm|ogg|mov|m4v|mkv|avi)(\?|$)/i;

export function isVideoUrl(url) {
  return typeof url === "string" && VIDEO_RE.test(url);
}

// Drop-in replacement for <img> that renders a <video> when the source is a
// video URL (a promoted clip stored in what is otherwise an image field), so
// space / menu / flash / gallery media can hold either an image or a video
// without showing a broken <img>. Pass `controls` for a full player (lightbox).
//
// Autoplaying previews play ONLY while on screen (IntersectionObserver) and
// pause when scrolled away — a gallery of muted loops otherwise decodes them
// all at once and tanks performance. (React port of ilot's v-play-visible.)
export default function SmartMedia({
  src,
  alt = "",
  loading,
  controls = false,
  ...rest
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return; // img or controls player — nothing to observe
    el.muted = true; // required for programmatic autoplay
    const safePlay = () => {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) safePlay();
          else if (!el.paused) el.pause();
        }
      },
      { threshold: 0.2, rootMargin: "150px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      try {
        el.pause();
      } catch {
        // element already detached
      }
    };
  }, [src, controls]);

  if (isVideoUrl(src)) {
    if (controls) {
      return <video src={src} controls autoPlay playsInline {...rest} />;
    }
    return (
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        {...rest}
      />
    );
  }
  return <img src={src} alt={alt} loading={loading} {...rest} />;
}
