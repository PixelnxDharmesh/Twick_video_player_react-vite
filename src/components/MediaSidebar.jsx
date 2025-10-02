function MediaSidebar({ mediaItems, mediaType, setMediaType, selectTool }) {
  return (
    <div className="media-sidebar">
      <h3>Media</h3>
      <div className="media-tabs">
        {["videos", "images", "audio", "elements"].map(type => (
          <button 
            key={type}
            className={mediaType === type ? "active" : ""}
            onClick={() => setMediaType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="media-list">
        {mediaItems[mediaType].map(item => (
          <div key={item.id} className="media-item">
            <div className="media-thumbnail">{item.thumbnail}</div>
            <div className="media-info">
              <div className="media-name">{item.name}</div>
              {item.duration && <div className="media-duration">{item.duration}</div>}
            </div>
          </div>
        ))}
      </div>

      <button className="sidebar-btn record-btn" onClick={() => selectTool("record")}>
        <span className="icon">●</span> Record
      </button>
    </div>
  );
}
export default MediaSidebar;
