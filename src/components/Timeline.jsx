import { useRef, useState, useEffect } from "react";

function Timeline({ 
  currentTime, 
  duration, 
  setCurrentTime, 
  videoRef, 
  videoSource,
  textOverlays,
  trimStart,
  trimEnd,
  cutPoints,
  isTrimmed,
  isCut,
  setTrimStart,
  setTrimEnd,
  // NEW: Props for adding new media
  onAddVideo,
  onAddAudio,
  onAddImage,
  imageOverlays = []
}) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizing, setResizing] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ trackId: null, position: 0 });
  
  const [tracks, setTracks] = useState([
    { id: 1, type: 'video', name: 'Video Track', clips: [] },
    { id: 2, type: 'audio', name: 'Audio Track', clips: [] },
    { id: 3, type: 'text', name: 'Text Overlays', clips: [] },
    { id: 4, type: 'image', name: 'Image Overlays', clips: [] } // NEW: Image track
  ]);

  // Initialize tracks when video loads
  useEffect(() => {
    if (duration > 0 && videoSource) {
      const videoClip = {
        id: 'video-1',
        type: 'video',
        start: 0,
        end: duration,
        duration: duration,
        source: videoSource,
        name: 'Main Video'
      };

      const audioClip = {
        id: 'audio-1',
        type: 'audio', 
        start: 0,
        end: duration,
        duration: duration,
        source: videoSource,
        name: 'Main Audio'
      };

      // Text overlays as clips
      const textClips = textOverlays.map((overlay, index) => ({
        id: `text-${overlay.id}`,
        type: 'text',
        start: 0,
        end: duration,
        duration: duration,
        name: `Text: ${overlay.text.substring(0, 15)}${overlay.text.length > 15 ? '...' : ''}`,
        content: overlay.text,
        overlayId: overlay.id
      }));

      // Image overlays as clips
      const imageClips = imageOverlays.map((image, index) => ({
        id: `image-${image.id}`,
        type: 'image',
        start: 0,
        end: duration,
        duration: duration,
        name: `Image: ${image.name.substring(0, 12)}${image.name.length > 12 ? '...' : ''}`,
        source: image.source,
        overlayId: image.id
      }));

      setTracks([
        { id: 1, type: 'video', name: 'Video Track', clips: [videoClip] },
        { id: 2, type: 'audio', name: 'Audio Track', clips: [audioClip] },
        { id: 3, type: 'text', name: 'Text Overlays', clips: textClips },
        { id: 4, type: 'image', name: 'Image Overlays', clips: imageClips }
      ]);
    }
  }, [duration, videoSource, textOverlays, imageOverlays]);

  // Update video playback when clips are resized
  useEffect(() => {
    if (videoRef.current && tracks[0].clips.length > 0) {
      const videoClip = tracks[0].clips[0];
      const audioClip = tracks[1].clips[0];
      
      // Set trim times based on clip boundaries
      setTrimStart(videoClip.start);
      setTrimEnd(videoClip.end);
      
      // If current time is outside clip range, adjust it
      if (currentTime < videoClip.start || currentTime > videoClip.end) {
        setCurrentTime(videoClip.start);
        videoRef.current.currentTime = videoClip.start;
      }
    }
  }, [tracks, currentTime]);

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
    // Check if clicking on resize handle
    if (e.target.classList.contains('resize-handle')) {
      const trackId = parseInt(e.target.dataset.trackId);
      const clipId = e.target.dataset.clipId;
      const handleType = e.target.dataset.handleType;
      
      const rect = trackRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const startTime = (offsetX / rect.width) * duration;
      
      setResizing({
        trackId,
        clipId,
        handleType,
        startX: e.clientX,
        startTime: startTime
      });
      e.stopPropagation();
    } else {
      // Regular timeline click for seeking
      setIsDragging(true);
      updateTimeFromMouse(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateTimeFromMouse(e);
    } else if (resizing) {
      handleResizeMove(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(null);
  };

  const handleResizeMove = (e) => {
    if (!resizing || !trackRef.current || !duration) return;

    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, offsetX / rect.width));
    const newTime = percent * duration;

    setTracks(prevTracks => {
      return prevTracks.map(track => {
        if (track.id !== resizing.trackId) return track;
        
        return {
          ...track,
          clips: track.clips.map(clip => {
            if (clip.id !== resizing.clipId) return clip;
            
            let newStart = clip.start;
            let newEnd = clip.end;
            
            if (resizing.handleType === 'left') {
              // Resize left handle - change start time
              newStart = Math.max(0, Math.min(newTime, clip.end - 1)); // Minimum 1s duration
            } else if (resizing.handleType === 'right') {
              // Resize right handle - change end time
              newEnd = Math.max(clip.start + 1, Math.min(newTime, duration)); // Minimum 1s duration
            }
            
            console.log(`Resizing ${clip.type}: ${newStart.toFixed(2)} - ${newEnd.toFixed(2)}`);
            
            return {
              ...clip,
              start: newStart,
              end: newEnd,
              duration: newEnd - newStart
            };
          })
        };
      });
    });
  };

  // NEW: Handle add button click
  const handleAddButtonClick = (trackId, e) => {
    e.stopPropagation();
    
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const position = (offsetX / rect.width) * 100;
    
    setAddMenuPosition({ trackId, position });
    setShowAddMenu(true);
  };

  // NEW: Handle media addition
  const handleAddMedia = (mediaType) => {
    const { trackId, position } = addMenuPosition;
    const startTime = (position / 100) * duration;
    
    switch (mediaType) {
      case 'video':
        if (onAddVideo) onAddVideo(startTime);
        break;
      case 'audio':
        if (onAddAudio) onAddAudio(startTime);
        break;
      case 'image':
        if (onAddImage) onAddImage(startTime);
        break;
      default:
        console.log('Unknown media type:', mediaType);
    }
    
    setShowAddMenu(false);
  };

  const formatTimeForRuler = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate ruler marks
  const generateRulerMarks = () => {
    const marks = [];
    const totalSeconds = duration;
    const interval = Math.max(1, Math.floor(totalSeconds / 10));
    
    for (let i = 0; i <= totalSeconds; i += interval) {
      marks.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(i / totalSeconds) * 100}%`,
            height: "100%",
            width: "1px",
            background: "#666",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div style={{ 
            fontSize: "10px", 
            color: "#999", 
            marginTop: "2px",
            whiteSpace: "nowrap"
          }}>
            {formatTimeForRuler(i)}
          </div>
        </div>
      );
    }
    return marks;
  };

  const getClipStyle = (clip, trackType) => {
    const left = (clip.start / duration) * 100;
    const width = ((clip.end - clip.start) / duration) * 100;

    const baseStyle = {
      position: "absolute",
      left: `${left}%`,
      width: `${width}%`,
      height: "80%",
      top: "10%",
      borderRadius: "4px",
      cursor: "move",
      overflow: "visible",
      minWidth: "30px",
      border: '2px solid transparent'
    };

    switch (trackType) {
      case 'video':
        return {
          ...baseStyle,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "2px solid #5a6fd8"
        };
      case 'audio':
        return {
          ...baseStyle,
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          border: "2px solid #e66879"
        };
      case 'text':
        return {
          ...baseStyle,
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          border: "2px solid #3aa8e6"
        };
      case 'image':
        return {
          ...baseStyle,
          background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
          border: "2px solid #ff6b6b"
        };
      default:
        return baseStyle;
    }
  };

  const getTrackIcon = (type) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'text': return '📝';
      case 'image': return '🖼️';
      default: return '●';
    }
  };

  const RenderResizeHandles = ({ clip, trackId }) => (
    <>
      {/* Left Resize Handle */}
      <div
        className="resize-handle"
        data-track-id={trackId}
        data-clip-id={clip.id}
        data-handle-type="left"
        style={{
          position: "absolute",
          left: "-6px",
          top: "0",
          bottom: "0",
          width: "12px",
          background: "rgba(255, 255, 255, 0.9)",
          cursor: "col-resize",
          border: "2px solid #333",
          borderRadius: "3px",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#333",
          fontSize: "10px",
          fontWeight: "bold"
        }}
        title="Drag to resize start time"
      >
        ⋮
      </div>
      
      {/* Right Resize Handle */}
      <div
        className="resize-handle"
        data-track-id={trackId}
        data-clip-id={clip.id}
        data-handle-type="right"
        style={{
          position: "absolute",
          right: "-6px",
          top: "0",
          bottom: "0",
          width: "12px",
          background: "rgba(255, 255, 255, 0.9)",
          cursor: "col-resize",
          border: "2px solid #333",
          borderRadius: "3px",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#333",
          fontSize: "10px",
          fontWeight: "bold"
        }}
        title="Drag to resize end time"
      >
        ⋮
      </div>
    </>
  );

  // NEW: Render Add Button for each track
  const RenderAddButton = ({ track }) => {
    // Find the end position of the last clip in this track
    const lastClip = track.clips[track.clips.length - 1];
    const endPosition = lastClip ? (lastClip.end / duration) * 100 : 0;
    
    return (
      <button
        onClick={(e) => handleAddButtonClick(track.id, e)}
        style={{
          position: "absolute",
          left: `${endPosition}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "24px",
          height: "24px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 25,
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
        }}
        title={`Add ${track.type} at ${formatTimeForRuler((endPosition / 100) * duration)}`}
      >
        +
      </button>
    );
  };

  // Get current clip boundaries for video playback
  const getCurrentClipBoundaries = () => {
    if (tracks[0].clips.length > 0) {
      const videoClip = tracks[0].clips[0];
      return { start: videoClip.start, end: videoClip.end };
    }
    return { start: 0, end: duration };
  };

  // Reset all clips to full duration
  const resetAllClips = () => {
    setTracks(prevTracks => 
      prevTracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => ({
          ...clip,
          start: 0,
          end: duration,
          duration: duration
        }))
      }))
    );
  };

  return (
    <div className="timeline-container" style={{ background: "#1a1a1a", padding: "10px", borderRadius: "8px" }}>
      {/* Timeline Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h3 style={{ margin: 0, color: "white", fontSize: "14px" }}>Timeline</h3>
        
        {/* Controls */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Clip Duration Info */}
          <div style={{ fontSize: "12px", color: "#4CAF50" }}>
            Clip: {formatTimeForRuler(getCurrentClipBoundaries().start)} - {formatTimeForRuler(getCurrentClipBoundaries().end)} 
          </div>
          
          {/* Reset Button */}
          <button 
            onClick={resetAllClips}
            style={{
              padding: "4px 8px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "11px"
            }}
            title="Reset all clips to full duration"
          >
            Reset Clips
          </button>
        </div>
      </div>

      {/* Time Ruler */}
      <div 
        className="time-ruler" 
        style={{ 
          position: "relative", 
          height: "25px", 
          background: "#2d2d2d", 
          borderBottom: "1px solid #444",
          overflow: "hidden"
        }}
      >
        {generateRulerMarks()}
        
        {/* Current Time Indicator */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "#ff4444",
            left: `${(currentTime / duration) * 100}%`,
            zIndex: 10
          }}
        />
        
        {/* Clip Boundaries */}
        {tracks[0].clips.length > 0 && (
          <>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${(getCurrentClipBoundaries().start / duration) * 100}%`,
                width: `${((getCurrentClipBoundaries().end - getCurrentClipBoundaries().start) / duration) * 100}%`,
                background: "rgba(76, 175, 80, 0.1)",
                border: "1px solid #4CAF50",
                zIndex: 4
              }}
            />
          </>
        )}
      </div>

      {/* Timeline Tracks */}
      <div
        className="timeline-tracks"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          position: "relative", 
          background: "#252525",
          border: "1px solid #444",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        {tracks.map((track, trackIndex) => (
          <div
            key={track.id}
            className="timeline-track"
            style={{
              display: "flex",
              height: "70px",
              borderBottom: trackIndex < tracks.length - 1 ? "1px solid #333" : "none",
              background: trackIndex % 2 === 0 ? "#2a2a2a" : "#252525",
              position: "relative"
            }}
          >
            {/* Track Header */}
            <div
              style={{
                width: "120px",
                padding: "10px",
                background: "#333",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRight: "1px solid #444",
                fontSize: "12px",
                color: "white"
              }}
            >
              <span>{getTrackIcon(track.type)}</span>
              <span>{track.name}</span>
            </div>

            {/* Track Content */}
            <div
              style={{
                flex: 1,
                position: "relative",
                padding: "8px"
              }}
            >
              {/* Track Background */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 49px,
                  #333 49px,
                  #333 50px
                )`
              }} />

              {/* Clips with Resize Handles */}
              {track.clips.map((clip) => (
                <div
                  key={clip.id}
                  style={getClipStyle(clip, track.type)}
                  title={`${clip.name}\n${formatTimeForRuler(clip.start)} - ${formatTimeForRuler(clip.end)}\nDrag the ⋮ handles to resize`}
                >
                  {/* Resize Handles */}
                  <RenderResizeHandles clip={clip} trackId={track.id} />
                  
                  {/* Clip Content */}
                  <div style={{
                    padding: "5px 8px",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: "bold",
                    background: "rgba(0,0,0,0.4)",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center"
                  }}>
                    {clip.name}
                    <br />
                    <span style={{ fontSize: "9px", opacity: "0.8" }}>
                      {formatTimeForRuler(clip.start)}-{formatTimeForRuler(clip.end)}
                    </span>
                  </div>
                </div>
              ))}

              {/* NEW: Add Button for each track */}
              <RenderAddButton track={track} />

              {/* Playhead */}
              <div
                className="playhead"
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "2px",
                  background: "red",
                  left: `${(currentTime / duration) * 100}%`,
                  zIndex: 20,
                  pointerEvents: "none"
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* NEW: Add Media Menu */}
      {showAddMenu && (
        <div
          style={{
            position: "absolute",
            left: `${addMenuPosition.position}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "#333",
            border: "1px solid #555",
            borderRadius: "8px",
            padding: "10px",
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            minWidth: "120px"
          }}
        >
          <div style={{ color: "white", fontSize: "12px", marginBottom: "8px", fontWeight: "bold" }}>
            Add Media at {formatTimeForRuler((addMenuPosition.position / 100) * duration)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <button
              onClick={() => handleAddMedia('video')}
              style={{
                padding: "8px 12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              🎬 Add Video
            </button>
            <button
              onClick={() => handleAddMedia('audio')}
              style={{
                padding: "8px 12px",
                background: "#f093fb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              🎵 Add Audio
            </button>
            <button
              onClick={() => handleAddMedia('image')}
              style={{
                padding: "8px 12px",
                background: "#ff9a9e",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              🖼️ Add Image
            </button>
          </div>
          <button
            onClick={() => setShowAddMenu(false)}
            style={{
              marginTop: "8px",
              padding: "5px 10px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "10px",
              width: "100%"
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Timeline Footer */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginTop: "10px",
        color: "#999",
        fontSize: "12px"
      }}>
        <div>
          • Click to seek • Drag <strong>⋮</strong> handles to resize • Click <strong>+</strong> to add media
        </div>
        <div style={{ color: "#4CAF50", fontWeight: "bold" }}>
          Active: {formatTimeForRuler(getCurrentClipBoundaries().end - getCurrentClipBoundaries().start)}
        </div>
      </div>
    </div>
  );
}

export default Timeline;