# Media Player

## Overview

Lecunity includes a compact media player for replaying source content after processing.

The player supports two source types:

- YouTube videos through an embedded YouTube player.
- Direct media URLs through the browser's HTML5 video player.

Uploaded local files are not supported by this player.

## Features

- **Floating player:** Changes to a fixed 320px-wide player when the user scrolls past its original position.
- **Mouse dragging:** Allows the floating player to be repositioned.
- **Edge snapping:** Snaps to the nearest horizontal screen edge when dragging ends.
- **Viewport boundaries:** Keeps the player within the visible screen area using padding.
- **Minimize and expand:** Hides or restores the playback area.
- **Source-specific styling:** Red styling for YouTube and blue styling for direct media.
- **Responsive layout:** Uses full available width before entering floating mode.

## Playback Methods

### YouTube

- Uses the YouTube embedded player.
- Extracts the video ID from supported YouTube URL formats.
- Provides standard YouTube playback controls through the embedded player.
- Displays the source filename in the player header.

### Direct Media URL

- Uses the browser's HTML5 video element.
- Provides native browser playback controls.
- Uses the submitted source URL directly.
- Playback depends on browser codec support and server accessibility.

## Floating Player Behavior

1. The player initially appears in the normal page layout.
2. Scrolling beyond its original position activates sticky mode.
3. The player moves into a fixed position near the upper-right side of the viewport.
4. The user can drag it using the mouse.
5. Releasing the mouse snaps it to the nearest left or right edge.
6. Scrolling back above the original position returns it to normal layout.

The player uses viewport boundary calculations to keep its position within the visible screen.

## Limitations

- Local file uploads are not available for replay through this component.
- Touch-based dragging is not implemented.
- YouTube playback depends on YouTube embedding availability.
- Direct media playback depends on browser-supported formats and server response behavior.
- Some media sources may fail because of access restrictions, unsupported codecs, or CORS-related issues.
- Offline playback is not guaranteed.
- The floating player uses mouse events rather than a dedicated touch or pointer-event implementation.

## Troubleshooting

### Player Does Not Appear

- Confirm the source type is `youtube` or `url`.
- Check that `sourceUrl` and `fileName` are provided.
- Check the browser console for errors.
- Confirm the source URL is accessible.

### YouTube Video Does Not Load

- Check whether the URL contains a valid YouTube video ID.
- Confirm that embedding is permitted for the video.
- Check browser network errors.

### Direct Media Does Not Play

- Confirm the URL points to a playable media resource.
- Check browser codec and format compatibility.
- Check whether the server permits access to the media.
- Inspect browser network and media errors.

### Player Does Not Drag

- Dragging is available only after the player enters sticky mode.
- Dragging currently uses mouse events.
- Touch dragging is not implemented.

## Technical Implementation

| File                          | Responsibility                                                     |
| ----------------------------- | ------------------------------------------------------------------ |
| `components/media-player.tsx` | Player interface, playback, dragging and sticky behavior           |
| `components/history.tsx`      | Displays previously processed results and their source information |

The player is designed to be lightweight and adaptable, with clear separation of concerns between the interface and the playback logic.
