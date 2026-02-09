import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, FileText, SkipForward, Video } from 'lucide-react';

/**
 * VideoPlayer
 *
 * Placeholder for future videos. Shows dashed box with play button
 * and "Video coming soon" when no URL is provided.
 *
 * When a URL is provided: renders <video> with custom controls,
 * chapter markers, and transcript toggle.
 *
 * Backward-compatible: still supports embed URLs (YouTube/Vimeo) via iframe.
 *
 * Props:
 *   url         - Video URL (optional, shows placeholder if absent)
 *   poster      - Poster image URL
 *   title       - Video title
 *   chapters    - Array of { time, label } for chapter markers (time in seconds)
 *   transcript  - String text for transcript toggle
 */

/** Format seconds to MM:SS */
const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/** Placeholder shown when no video URL is provided */
const VideoPlaceholder = ({ title }) => (
  <div className="relative bg-[#0a3d2e] border-2 border-dashed border-[#1a8a68] rounded-xl min-h-[180px] flex flex-col items-center justify-center gap-3 p-6">
    <div className="w-14 h-14 rounded-full bg-[#1a8a68]/40 border-2 border-[#4ade80]/50 flex items-center justify-center">
      <Play className="w-7 h-7 text-[#4ade80] ml-0.5" />
    </div>
    {title && (
      <p className="text-white/70 text-sm font-medium text-center">{title}</p>
    )}
    <p className="text-white/40 text-xs">Video coming soon</p>
  </div>
);

/** Embed player for YouTube/Vimeo URLs (backward compatibility) */
const EmbedPlayer = ({ url, title }) => (
  <div className="bg-[#0a3d2e] border border-[#1a8a68]/50 rounded-xl overflow-hidden">
    {title && (
      <div className="px-3 py-2 border-b border-[#1a8a68]/30">
        <p className="text-white text-xs font-medium">{title}</p>
      </div>
    )}
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={url}
        title={title || 'Tutorial video'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  </div>
);

const VideoPlayer = ({
  url,
  poster,
  title,
  chapters = [],
  transcript,
}) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [progress, setProgress] = useState(0);

  // No URL: show placeholder
  if (!url) {
    return <VideoPlaceholder title={title} />;
  }

  // Embed URLs: use iframe (backward compatible)
  const isEmbed = url.includes('youtube.com/embed') || url.includes('player.vimeo.com');
  if (isEmbed) {
    return <EmbedPlayer url={url} title={title} />;
  }

  /** Toggle play/pause */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  /** Toggle mute */
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  /** Request fullscreen */
  const goFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  }, []);

  /** Seek to time on progress bar click */
  const handleProgressClick = useCallback((e) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
  }, []);

  /** Jump to chapter */
  const seekTo = useCallback((time) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    }
  }, []);

  /** Time update handler */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
    };
  }, [url]);

  return (
    <div className="space-y-2">
      {title && (
        <p className="text-xs text-[#4ade80] font-semibold">{title}</p>
      )}

      {/* Video container */}
      <div className="relative bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={url}
          poster={poster}
          className="w-full aspect-video bg-black"
          playsInline
          onClick={togglePlay}
        />

        {/* Custom controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-2 relative group"
            onClick={handleProgressClick}
          >
            {/* Played progress */}
            <div
              className="h-full bg-[#4ade80] rounded-full transition-all relative animate-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#4ade80] rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Chapter markers */}
            {chapters.map((ch, i) => {
              const markerPct = duration ? (ch.time / duration) * 100 : 0;
              return (
                <button
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-white/60 rounded-sm hover:bg-white transition-colors min-w-[6px]"
                  style={{ left: `${markerPct}%`, transform: 'translate(-50%, -50%)' }}
                  onClick={(e) => { e.stopPropagation(); seekTo(ch.time); }}
                  title={ch.label}
                  aria-label={`Chapter: ${ch.label}`}
                />
              );
            })}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#4ade80] transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleMute}
              className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#4ade80] transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time display */}
            <span className="text-[10px] text-white/70 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Transcript toggle */}
            {transcript && (
              <button
                onClick={() => setShowTranscript((prev) => !prev)}
                className={`w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
                  showTranscript ? 'text-[#4ade80]' : 'text-white hover:text-[#4ade80]'
                }`}
                aria-label="Toggle transcript"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={goFullscreen}
              className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#4ade80] transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      {chapters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => seekTo(ch.time)}
              className="inline-flex items-center gap-1 px-2 py-1 min-h-[44px] rounded-md bg-[#0d5943]/60 hover:bg-[#1a8a68]/50 text-white/70 hover:text-white text-[10px] transition-colors"
            >
              <SkipForward className="w-3 h-3 text-[#4ade80]" />
              <span className="font-mono text-[#4ade80]">{formatTime(ch.time)}</span>
              <span>{ch.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Transcript panel */}
      {showTranscript && transcript && (
        <div className="bg-[#0d5943]/40 border border-[#1a8a68]/50 rounded-lg p-3 max-h-[200px] overflow-y-auto custom-scrollbar">
          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
