# PR Description: Group Video Call Integration (LiveKit)

## Overview

This PR introduces a robust group video call feature integrated into the RCC Healthcare platform. Leveraging **LiveKit**, a high-performance, open-source real-time communication platform, we now support low-latency video, audio, and screen-sharing capabilities for multiple participants.

## Key Features

- **Group Video Calls**: Supports multiple participants with high-quality video and audio.
- **Screen Sharing**: Integrated screen sharing functionality for collaborative reviews.
- **In-Call Chat**: Synchronized chat panel for real-time messaging during calls.
- **Persistent Call Experience**: 
  - **Floating Call Panel**: Video calls persist across route navigation, allowing users to continue working while staying in the call.
  - **Minimize/Maximize**: Users can minimize the call to a small floating button or expand it to a full video panel.
  - **Global State Management**: Call state is managed globally via React Context, ensuring seamless navigation.
- **Google Meet Inspired UI**: A clean, modern interface featuring:
  - Floating control bar with micro-animations.
  - Participant video grid that adjusts dynamically.
  - Speaker identification and connection quality indicators.
- **Device Management**: One-click toggle for Camera and Microphone with permission handling.

## Technical Implementation

### Backend

- **Module**: New `video-calls` module in the NestJS backend.
- **Token Generation**: Secure endpoint (`POST /video-calls/token`) that generates LiveKit Access Tokens using the `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
- **Signaling**: Integrated with existing Socket.IO for call invitations and signaling.

### Frontend

- **Technology**: Built with `@livekit/components-react` and `livekit-client`.
- **State Management**: 
  - **VideoCallContext**: Global context provider that manages call state (token, caller info, invite mode) across the entire application.
  - **PersistentCallPanel**: Floating panel component that renders the video call interface and stays mounted during route navigation.
  - **VideoCallPage**: Simplified page component that only handles user list and call initiation; the actual call UI is rendered in the persistent panel.
- **Architecture**: 
  - **Context-Based State**: Call state is lifted to `VideoCallContext` at the app root level, allowing any component to initiate/manage calls.
  - **Persistent Rendering**: `PersistentCallPanel` is mounted in `App.tsx` and remains active regardless of current route.
  - **Minimized State**: Users can minimize the call to a small floating button (picture-in-picture style) or expand it to a full video panel.
- **Components**: Modularized into `VideoGrid`, `ChatPanel`, `TopActionBar`, `ControlBarWrapper`, and `PersistentCallPanel`.

## Environment Setup

To use the video call feature locally or in development, you need to configure the following variables:

### Backend (.env)

```env
LIVEKIT_API_KEY=devtest
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=http://livekit:7880
```

### Frontend (.env)

```env
VITE_LIVEKIT_URL=ws://localhost:7880
```

## Docker Configuration

The `docker-compose.yml` has been updated to include a LiveKit server instance.

### Running with Docker

1. Ensure your Docker daemon is running.
2. Run the platform using:

   ```bash
   docker compose up -d
   ```

   or

   ```bash
   docker compose up livekit
   ```

   to up just the livekit service

3. The LiveKit server will be available at `http://localhost:7880`. 
  - if you want to be sure if it's work navigate to port 7880 you will suppose to see black screen has `OK` o it 
4. The backend communicates with LiveKit using the internal bridge `http://livekit:7880`.

## How to Use

1. Log in to the application.
2. Navigate to the **Communication** (Video Call) page.
3. Select a user from the list to initiate a call.
4. The recipient will receive an incoming call notification.
5. Once accepted, both users will enter the LiveKit room.
6. The call will appear as a floating panel in the bottom-right corner.
7. **Navigate freely**: You can navigate to other pages (Dashboard, Patients, etc.) while staying in the call.
8. **Minimize/Maximize**: Click the minimize button to collapse the call to a small floating button, or click the button to expand it again.
9. Use the bottom control bar to manage media and the top bar to invite more participants or open the chat.
10. The call will remain active until you explicitly end it, regardless of which page you're on.

## Architecture Details

### Persistent Call Flow

1. **Call Initiation**: User clicks "Call" on a user in `VideoCallPage`.
2. **Context Update**: `VideoCallContext.startCall()` generates room ID, fetches token, and updates global state.
3. **Panel Activation**: `PersistentCallPanel` detects `liveKitToken` and renders `LiveKitCallInterface`.
4. **Route Navigation**: User navigates to other pages; `PersistentCallPanel` remains mounted and visible.
5. **Minimize/Maximize**: User can toggle between minimized (small button) and expanded (video panel) states.
6. **Call End**: User clicks "End Call"; context resets, panel unmounts.

### Key Components

- **`VideoCallContext`** (`contexts/VideoCallContext.tsx`): Manages global call state and actions.
- **`PersistentCallPanel`** (`components/VideoCall/PersistentCallPanel.tsx`): Floating panel that renders the call UI.
- **`VideoCallPage`** (`pages/VideoCall/VideoCallPage.tsx`): User list and call initiation interface.
- **`LiveKitCallInterface`**: Core video call component (unchanged, works in both full-page and panel modes).

### Benefits

- ✅ Users can continue working while in a call
- ✅ No call interruption when navigating between pages
- ✅ Clean separation of concerns (page vs. call UI)
- ✅ Reusable call state across the application
- ✅ Better UX with minimize/maximize functionality
