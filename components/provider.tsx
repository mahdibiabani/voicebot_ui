'use client';

import React from 'react';
import { Room } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import { AppConfig } from '@/lib/types';

export function Provider({
  appConfig,
  children,
}: {
  appConfig: AppConfig;
  children: React.ReactNode;
}) {
  const { connectionDetails } = useConnectionDetails(appConfig);
  const room = React.useMemo(() => new Room({
    wsHeaders: {
      'X-Frame-Options': 'ALLOWALL',
    }
  }), []);

  React.useEffect(() => {
    if (room.state === 'disconnected' && connectionDetails) {
      // Check if media devices are available before trying to enable microphone
      const enableMicrophone = async () => {
        try {
          // Check if getUserMedia is available
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Media devices not supported in this browser');
          }
          
          await room.localParticipant.setMicrophoneEnabled(true, undefined, {
            preConnectBuffer: true,
          });
        } catch (error) {
          console.warn('Failed to enable microphone:', error);
          // Continue without microphone if it fails
        }
      };

      Promise.all([
        enableMicrophone(),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ]).catch((error) => {
        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      room.disconnect();
    };
  }, [room, connectionDetails]);

  return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
}
