"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoObserver = void 0;
var tslib_1 = require("tslib");
var track_video_1 = require("../video-analytics/track-video");
var VideoObserver = /** @class */ (function () {
    function VideoObserver(_a) {
        var videoEl = _a.videoEl, onStateChange = _a.onStateChange, vendor = _a.vendor, isEmbedded = _a.isEmbedded;
        var _this = this;
        this.state = {
            playbackState: 'paused',
        };
        this.handler = {
            onPlay: function (evt) {
                _this.updatePlaybackState('playing', evt);
            },
            onPause: function (evt) {
                _this.updatePlaybackState('paused', evt);
            },
            onEnded: function (evt) {
                _this.updatePlaybackState('ended', evt);
            },
            onSeeking: function () {
                var nextState = tslib_1.__assign(tslib_1.__assign({}, _this.state), { isSeeking: true });
                _this.updateState(nextState);
            },
            onSeeked: function (event) {
                var nextState = tslib_1.__assign(tslib_1.__assign({}, _this.state), { isSeeking: false, position: event.last_position });
                _this.updateState(nextState);
            },
            onError: function (errorMessage) {
                _this.updateStateWithError(errorMessage);
            },
            onTimeUpdate: function (evt) {
                _this.updateTime(evt);
            },
        };
        this.onStateChange = onStateChange;
        if (isEmbedded) {
            this.untrack = (0, track_video_1.trackEmbeddedVideo)(videoEl, this.handler, vendor);
        }
        else {
            this.untrack = (0, track_video_1.trackHtmlVideo)(videoEl, this.handler, vendor);
        }
    }
    VideoObserver.prototype.stateChangeHandler = function (previousState, nextState) {
        try {
            this.onStateChange(previousState, nextState);
        }
        catch (_error) {
            // Swallow callback errors to keep observer state consistent.
        }
    };
    VideoObserver.prototype.updateStateWithError = function (error) {
        var previousState = this.state;
        var nextState = tslib_1.__assign(tslib_1.__assign({}, previousState), { playbackState: 'error', errorMessage: error });
        this.updateState(nextState);
    };
    VideoObserver.prototype.updatePlaybackState = function (playbackState, event) {
        var nextState = tslib_1.__assign(tslib_1.__assign({}, this.state), { playbackState: playbackState, lastEvent: event, position: event.last_position });
        this.updateState(nextState);
    };
    VideoObserver.prototype.updateTime = function (event) {
        var _a, _b;
        var lastVideoEvent = this.state.lastEvent;
        if (!lastVideoEvent || this.state.playbackState !== 'playing') {
            return;
        }
        var isSeeking = event.isSeeking || this.state.isSeeking;
        var lastPosition = (_a = this.state.position) !== null && _a !== void 0 ? _a : 0;
        var nextPosition = event.position;
        if (isSeeking) {
            this.state = tslib_1.__assign(tslib_1.__assign({}, this.state), { position: nextPosition });
            return;
        }
        var timeDelta = nextPosition - lastPosition;
        var nextState = tslib_1.__assign(tslib_1.__assign({}, this.state), { position: nextPosition, watchTime: ((_b = this.state.watchTime) !== null && _b !== void 0 ? _b : 0) + timeDelta });
        this.updateState(nextState);
    };
    VideoObserver.prototype.updateState = function (nextState) {
        var previousState = this.state;
        this.state = nextState;
        this.stateChangeHandler(previousState, nextState);
    };
    VideoObserver.prototype.destroy = function () {
        this.untrack();
    };
    return VideoObserver;
}());
exports.VideoObserver = VideoObserver;
//# sourceMappingURL=video.js.map