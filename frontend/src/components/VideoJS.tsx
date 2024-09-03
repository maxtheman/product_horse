import React from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import type VideoJsPlayerOptions from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
export const VideoJS = (props: { options: VideoJsPlayerOptions, onReady: (player: Player) => void }) => {
    const videoRef = React.useRef<HTMLDivElement>(null);
    const playerRef = React.useRef<Player | null>(null);
    const { options, onReady } = props;

    React.useEffect(() => {

        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode. 
            const videoElement = document.createElement("video-js");

            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current?.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                if (onReady) {
                    onReady(player);
                }
            });

            // You could update an existing player in the `else` block here
            // on prop change, for example:
        } else {
            const player = playerRef.current;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            player.autoplay(options.autoplay);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            player.src(options.sources);
        }
    }, [options, videoRef, onReady]);

    // Dispose the Video.js player when the functional component unmounts
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