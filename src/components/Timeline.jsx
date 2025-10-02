import { useRef, useState } from "react";

function Timeline({ currentTime, duration, setCurrentTime, videoRef }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // helper: calculate time based on mouse X
  const updateTimeFromMouse = (e) => {
    if (!trackRef.current || !duration) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, offsetX / rect.width));
    const newTime = percent * duration;

    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateTimeFromMouse(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateTimeFromMouse(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="timeline-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="time-ruler">
        <span>0:00</span>
        <span>{Math.round(duration / 2)}s</span>
        <span>{Math.round(duration)}s</span>
      </div>

      <div
        className="timeline-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{ position: "relative", height: "40px", background: "#222" }}
      >
        {/* playhead */}
        <div
          className="playhead"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "red",
            left: `${(currentTime / duration) * 100}%`,
            cursor: "pointer",
          }}
        />
        <div className="video-clip">Video Track</div>
        <div className="audio-clip">Audio Track</div>
      </div>
    </div>
  );
}
export default Timeline;
