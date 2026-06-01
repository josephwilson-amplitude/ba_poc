import type { VideoEvent, EmbeddedVideoPlayer, MuxElement, Vendor } from '../video-analytics/types';
export type { Vendor };
type PlaybackState = 'playing' | 'paused' | 'ended' | 'error' | 'seeking';
export type State = {
    playbackState: PlaybackState;
    errorMessage?: string;
    lastEvent?: VideoEvent;
    watchTime?: number;
    position?: number | null;
    isSeeking?: boolean;
};
export type VideoObserverParams = {
    videoEl: HTMLVideoElement | EmbeddedVideoPlayer | MuxElement;
    onStateChange: (previousState: State, nextState: State) => void;
    vendor?: Vendor;
    isEmbedded?: boolean;
};
export declare class VideoObserver {
    private state;
    private untrack;
    private onStateChange;
    private handler;
    constructor({ videoEl, onStateChange, vendor, isEmbedded }: VideoObserverParams);
    private stateChangeHandler;
    private updateStateWithError;
    private updatePlaybackState;
    private updateTime;
    private updateState;
    destroy(): void;
}
//# sourceMappingURL=video.d.ts.map