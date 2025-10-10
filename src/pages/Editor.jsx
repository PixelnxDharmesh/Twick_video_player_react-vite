import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import MediaSidebar from "../components/MediaSidebar/MediaSidebar";
import CanvasArea from "../components/CanvasArea";
import ToolsSidebar from "../components/ToolsSidebar";
import Timeline from "../components/Timeline";
import Controls from "../components/Controls";

function Editor() {
  // All states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSource, setVideoSource] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [activeTool, setActiveTool] = useState("select");
  const [mediaType, setMediaType] = useState("videos");
  const [canvasOptions, setCanvasOptions] = useState({
    fill: true,
    fit: false,
    flipHorizontal: false,
    flipVertical: false,
    rotate: 0,
  });
  const [textOverlays, setTextOverlays] = useState([]);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [newText, setNewText] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [textStyle, setTextStyle] = useState({
    color: "#ffffff",
    fontSize: "24px",
    fontFamily: "Arial",
  });

  // Trim states
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [originalVideoSource, setOriginalVideoSource] = useState("");
  const [isTrimmed, setIsTrimmed] = useState(false);

  // NEW: Cut states
  const [cutPoints, setCutPoints] = useState([]);
  const [isCut, setIsCut] = useState(false);
  const [cutSegments, setCutSegments] = useState([]);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  //image upload
  const [imageOverlays, setImageOverlays] = useState([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Sample media data
  const mediaItems = {
    videos: [
      { id: 1, name: "Intro", thumbnail: "📹", duration: "0:15" },
      { id: 2, name: "Scene 1", thumbnail: "🎬", duration: "0:25" },
      { id: 3, name: "Scene 2", thumbnail: "🎥", duration: "0:18" },
    ],
    images: [
      { id: 1, name: "Background", thumbnail: "🖼️", duration: "" },
      { id: 2, name: "Overlay", thumbnail: "📸", duration: "" },
      { id: 3, name: "Watermark", thumbnail: "🖼️", duration: "" },
    ],
    audio: [
      { id: 1, name: "Background Music", thumbnail: "🎵", duration: "2:30" },
      { id: 2, name: "Sound Effects", thumbnail: "🎶", duration: "0:45" },
      { id: 3, name: "Voiceover", thumbnail: "🎤", duration: "1:15" },
    ],
    elements: [
      { id: 1, name: "Shape 1", thumbnail: "🔷", duration: "" },
      { id: 2, name: "Icon", thumbnail: "⭐", duration: "" },
      { id: 3, name: "Sticker", thumbnail: "😂", duration: "" },
    ],
  };

  // NEW: Handle media selection for different types
  const handleMediaSelect = (mediaItem) => {
    console.log("Media selected:", mediaItem);
    
    switch (mediaItem.type) {
      case 'video':
        setVideoSource(mediaItem.source);
        break;
      case 'image':
        addImageOverlay(mediaItem.source, mediaItem.name);
        break;
      case 'audio':
        // Handle audio (you can implement audio tracks later)
        alert(`Audio selected: ${mediaItem.name} - Audio functionality coming soon!`);
        break;
      case 'element':
        // Handle elements (shapes, icons, etc.)
        alert(`Element selected: ${mediaItem.name} - Element functionality coming soon!`);
        break;
      default:
        console.log("Unknown media type:", mediaItem.type);
    }
  };

  // NEW: Add image overlay to canvas
  const addImageOverlay = (imageSource, imageName = "Image") => {
    const newImageOverlay = {
      id: Date.now(),
      type: 'image',
      source: imageSource,
      name: imageName,
      position: { x: 50, y: 50 }, // Center position
      size: { width: 200, height: 150 }, // Default size
      opacity: 1,
      rotation: 0
    };
    
    setImageOverlays(prev => [...prev, newImageOverlay]);
  };

  // NEW: Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageURL = URL.createObjectURL(file);
      addImageOverlay(imageURL, file.name);
      setShowImageUpload(false);
    }
  };

  // NEW: Handle URL image
  const handleUrlImageAdd = () => {
    if (imageUrl.trim()) {
      addImageOverlay(imageUrl, "URL Image");
      setImageUrl("");
      setShowImageUpload(false);
    }
  };

  // NEW: Delete image overlay
const deleteImageOverlay = (id) => {
  setImageOverlays(prev => prev.filter(img => img.id !== id));
  setSelectedId(null); // Selection clear karo
};
  // NEW: Update image overlay position/size
  const updateImageOverlay = (id, updates) => {
    setImageOverlays(prev => 
      prev.map(img => 
        img.id === id ? { ...img, ...updates } : img
      )
    );
  };


  // Initialize trim times when duration is available
  useEffect(() => {
    if (duration > 0 && trimEnd === 0) {
      setTrimEnd(duration);
    }
  }, [duration]);

  // Store original video source when video is loaded
  useEffect(() => {
    if (videoSource && !originalVideoSource) {
      setOriginalVideoSource(videoSource);
    }
  }, [videoSource]);

  // Handle time update with trim restrictions
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // If trimmed, loop within trim range
      if (isTrimmed && current >= trimEnd) {
        videoRef.current.currentTime = trimStart;
        if (isPlaying) {
          videoRef.current.play();
        }
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // If trimmed, start from trim start
        if (isTrimmed && videoRef.current.currentTime < trimStart) {
          videoRef.current.currentTime = trimStart;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const newDuration = videoRef.current.duration;
      setDuration(newDuration);
      setTrimEnd(newDuration);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const selectTool = (tool) => {
    setActiveTool(tool);
    if (tool === "text") setShowTextEditor(true);
  };

  const updateCanvasOption = (option, value) => {
    setCanvasOptions((prev) => {
      if (option === "fill") {
        return { ...prev, fill: value, fit: !value };
      }
      if (option === "fit") {
        return { ...prev, fit: value, fill: !value };
      }
      return { ...prev, [option]: value };
    });
  };

  const addTextOverlay = () => {
    if (newText.trim()) {
      setTextOverlays((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: newText,
          position: { x: 50, y: 50 },
          style: { ...textStyle },
        },
      ]);
      setNewText("");
      setShowTextEditor(false);
    }
  };

  const handleImport = () => fileInputRef.current.click();

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setVideoSource(videoURL);
      setOriginalVideoSource(videoURL);
      if (videoRef.current) {
        videoRef.current.load();
        setIsPlaying(false);
        setIsTrimmed(false);
        setIsCut(false);
        setTrimStart(0);
        setTrimEnd(0);
        setCutPoints([]);
        setCutSegments([]);
      }
    }
  };

  const deleteOverlay = () => {
    if (selectedId) {
      setTextOverlays((prev) => prev.filter((o) => o.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Trim functions
  const applyTrim = () => {
    if (videoRef.current && trimStart < trimEnd) {
      // Set trimmed state
      setIsTrimmed(true);
      setIsCut(false); // Reset cut when applying trim
      
      // Set current time to trim start
      videoRef.current.currentTime = trimStart;
      
      // Show success message
      alert(`Video trimmed from ${formatTime(trimStart)} to ${formatTime(trimEnd)}. Export will include only this segment.`);
    } else {
      alert("Invalid trim range. Start time must be less than end time.");
    }
  };

  const resetTrim = () => {
    setTrimStart(0);
    setTrimEnd(duration);
    setIsTrimmed(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // NEW: Cut functions
  const addCutPoint = () => {
    if (videoRef.current && currentTime >= 0) {
      const newCutPoints = [...cutPoints, currentTime].sort((a, b) => a - b);
      setCutPoints(newCutPoints);
    }
  };

  const removeCutPoint = (index) => {
    const newCutPoints = cutPoints.filter((_, i) => i !== index);
    setCutPoints(newCutPoints);
  };

  const applyCut = () => {
    if (cutPoints.length > 0 && videoRef.current) {
      setIsCut(true);
      setIsTrimmed(false); // Reset trim when applying cut
      
      // Create segments from cut points
      const segments = [];
      let start = 0;
      
      cutPoints.forEach(cutPoint => {
        if (cutPoint > start) {
          segments.push({ start, end: cutPoint });
        }
        start = cutPoint;
      });
      
      // Add final segment if needed
      if (start < duration) {
        segments.push({ start, end: duration });
      }
      
      setCutSegments(segments);
      alert(`Cut applied with ${cutPoints.length} points. Video will be split into ${segments.length} segments during export.`);
    } else {
      alert("Please add at least one cut point.");
    }
  };

  const resetCut = () => {
    setCutPoints([]);
    setCutSegments([]);
    setIsCut(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Get current video processing info
  const getVideoProcessingInfo = () => {
    if (isTrimmed) {
      return { type: 'trim', start: trimStart, end: trimEnd };
    } else if (isCut) {
      return { type: 'cut', segments: cutSegments };
    }
    return null;
  };
// Editor.jsx mein ye function fix karo
const deleteSelected = () => {
  if (!selectedId) return;
  
  console.log("Deleting selected:", selectedId, typeof selectedId);
  
  // Agar selectedId string hai aur 'image-' se start hota hai
  if (typeof selectedId === 'string' && selectedId.startsWith('image-')) {
    // Image delete karo
    const imageId = parseInt(selectedId.replace('image-', ''));
    deleteImageOverlay(imageId);
    console.log("Deleted image:", imageId);
  } else {
    // Text delete karo (selectedId number ya koi aur type)
    deleteOverlay();
    console.log("Deleted text overlay");
  }
  
  setSelectedId(null); // Selection clear karo
};

// Keyboard listener ko bhi update karo
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
      e.preventDefault();
      deleteSelected();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedId]);

// Editor.jsx mein ye functions add karo
const handleAddVideo = (startTime) => {
  // File input trigger karo ya video selection dialog show karo
  fileInputRef.current?.click();
  console.log("Add video at time:", startTime);
  // Yahan aap startTime use kar sakte hain new video ko position karne ke liye
};

const handleAddAudio = (startTime) => {
  alert(`Add audio functionality at ${startTime}s - Coming soon!`);
  // Yahan audio add karne ka logic implement karo
};

const handleAddImage = (startTime) => {
  alert(`Add image functionality at ${startTime}s - Click on Images tab in Media Sidebar to add images`);
  // Yahan image add karne ka logic implement karo
};
  return (
    <div className="app">
      <Header />
      <div className="editor-layout">
        <MediaSidebar
          mediaItems={mediaItems}
          mediaType={mediaType}
          setMediaType={setMediaType}
          selectTool={selectTool}
          onMediaSelect={handleMediaSelect}
        />

        <div className="editor-main">
// In Editor.jsx, make sure to pass the image overlay props to CanvasArea
<CanvasArea
  videoRef={videoRef}
  videoSource={videoSource}
  canvasOptions={canvasOptions}
  textOverlays={textOverlays}
  setTextOverlays={setTextOverlays}
  selectedId={selectedId}
  setSelectedId={setSelectedId}
  handleTimeUpdate={handleTimeUpdate}
  handleLoadedMetadata={handleLoadedMetadata}
  processingInfo={getVideoProcessingInfo()}
  // NEW: Image overlay props
  imageOverlays={imageOverlays}
  setImageOverlays={setImageOverlays}
  deleteImageOverlay={deleteImageOverlay}
  updateImageOverlay={updateImageOverlay}
/>
          <div className="canvas-controls">
            <h3>Canvas</h3>
            <button
              className={canvasOptions.fill ? "active" : ""}
              onClick={() => updateCanvasOption("fill", true)}
            >
              Fill
            </button>
            <button
              className={canvasOptions.fit ? "active" : ""}
              onClick={() => updateCanvasOption("fit", true)}
            >
              Fit
            </button>
            <button 
              onClick={() => updateCanvasOption("flipHorizontal", !canvasOptions.flipHorizontal)}
            >
              Flip H
            </button>
            <button 
              onClick={() => updateCanvasOption("flipVertical", !canvasOptions.flipVertical)}
            >
              Flip V
            </button>
            <button 
              onClick={() => updateCanvasOption("rotate", (canvasOptions.rotate + 90) % 360)}
            >
              Rotate
            </button>
            
            {/* Status Indicators */}
            {isTrimmed && (
              <div style={{ 
                marginTop: "10px", 
                padding: "5px", 
                background: "#4CAF50", 
                color: "white", 
                borderRadius: "3px",
                fontSize: "12px"
              }}>
                Trimmed: {formatTime(trimStart)} - {formatTime(trimEnd)}
              </div>
            )}
            {isCut && (
              <div style={{ 
                marginTop: "10px", 
                padding: "5px", 
                background: "#FF9800", 
                color: "white", 
                borderRadius: "3px",
                fontSize: "12px"
              }}>
                Cut Applied: {cutPoints.length} points
              </div>
            )}
          </div>

<Timeline
  currentTime={currentTime}
  duration={duration}
  setCurrentTime={setCurrentTime}
  videoRef={videoRef}
  videoSource={videoSource}
  textOverlays={textOverlays}
  trimStart={trimStart}
  trimEnd={trimEnd}
  cutPoints={cutPoints}
  isTrimmed={isTrimmed}
  isCut={isCut}
  setTrimStart={setTrimStart}
  setTrimEnd={setTrimEnd}
  onAddVideo={handleAddVideo}
  onAddAudio={handleAddAudio}
  onAddImage={handleAddImage}
  imageOverlays={imageOverlays}
/>

          <Controls
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            videoRef={videoRef}
            setCurrentTime={setCurrentTime}
            handleImport={handleImport}
            fileInputRef={fileInputRef}
            handleVideoUpload={handleVideoUpload}
          />
        </div>
<ToolsSidebar
  activeTool={activeTool}
  selectTool={selectTool}
  showTextEditor={showTextEditor}
  setShowTextEditor={setShowTextEditor}
  newText={newText}
  setNewText={setNewText}
  addTextOverlay={addTextOverlay}
  textStyle={textStyle}
  setTextStyle={setTextStyle}
  formatTime={formatTime}
  currentTime={currentTime}
  duration={duration}
  deleteSelected={deleteSelected} // ✅ NEW: Combined delete function
  selectedId={selectedId}
  // Trim props
  trimStart={trimStart}
  setTrimStart={setTrimStart}
  trimEnd={trimEnd}
  setTrimEnd={setTrimEnd}
  applyTrim={applyTrim}
  resetTrim={resetTrim}
  isTrimmed={isTrimmed}
  // Cut props
  cutPoints={cutPoints}
  addCutPoint={addCutPoint}
  removeCutPoint={removeCutPoint}
  applyCut={applyCut}
  resetCut={resetCut}
/>
      </div>
    </div>
  );
}

export default Editor;