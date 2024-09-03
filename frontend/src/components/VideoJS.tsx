import React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Define a type for the player instance
type PlayerInstance = ReturnType<typeof videojs>;

// Define a type for the player options
type PlayerOptions = Parameters<typeof videojs>[1];

// Define props for the VideoJS component
interface VideoJSProps {
  options: PlayerOptions;
  onReady: (player: PlayerInstance) => void;
}

export const VideoJS: React.FC<VideoJSProps> = (props) => {
  const videoRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<PlayerInstance | null>(null);
  const { options, onReady } = props;

  React.useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current?.appendChild(videoElement);

      const player = videojs(videoElement, options, () => {
        videojs.log('player is ready');
        onReady(player);
      });

      playerRef.current = player;
    } else {
      const player = playerRef.current;
      
      // Update player options
      player.autoplay(options.autoplay);
      player.src(options.sources || []);
    }
  }, [options, videoRef, onReady]);

  React.useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
}

export default VideoJS;