// src/utils/videoExporter.js
export async function exportVideo({ videoRef, textOverlays, canvasOptions, processingInfo }) {
  if (!videoRef.current) throw new Error("Video element not found");

  const video = videoRef.current;

  // Create a hidden canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const stream = canvas.captureStream(30); // 30 fps
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    recorder.onerror = (err) => reject(err);

    recorder.start();

    let startTime = 0;
    let endTime = video.duration;
    let segments = [];

    // Set up processing based on type
    if (processingInfo) {
      if (processingInfo.type === 'trim') {
        startTime = processingInfo.start;
        endTime = processingInfo.end;
      } else if (processingInfo.type === 'cut') {
        segments = processingInfo.segments;
        // For cut, we'll process the first segment (in a real app, you'd concatenate all segments)
        if (segments.length > 0) {
          startTime = segments[0].start;
          endTime = segments[0].end;
        }
      }
    }

    video.currentTime = startTime;
    video.play();

    const draw = () => {
      if (!video.paused && !video.ended && video.currentTime <= endTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply flip/rotate from canvasOptions
        ctx.save();
        if (canvasOptions?.flipHorizontal || canvasOptions?.flipVertical) {
          ctx.translate(
            canvasOptions.flipHorizontal ? canvas.width : 0,
            canvasOptions.flipVertical ? canvas.height : 0
          );
          ctx.scale(
            canvasOptions.flipHorizontal ? -1 : 1,
            canvasOptions.flipVertical ? -1 : 1
          );
        }
        if (canvasOptions?.rotate) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((canvasOptions.rotate * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw text overlays
        textOverlays.forEach((o) => {
          ctx.fillStyle = o.style.color;
          ctx.font = `${o.style.fontSize || "24px"} ${o.style.fontFamily || "Arial"}`;
          ctx.fillText(
            o.text,
            (o.position?.x || 50) * canvas.width / 100,
            (o.position?.y || 50) * canvas.height / 100
          );
        });

        requestAnimationFrame(draw);
      } else if (video.currentTime >= endTime) {
        // Stop when reaching end time
        if (recorder.state === "recording") {
          recorder.stop();
        }
        video.pause();
      }
    };

    draw();

    // Fallback stop condition
    video.onended = () => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
      video.pause();
    };
  });
}