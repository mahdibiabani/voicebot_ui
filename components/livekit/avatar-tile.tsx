import { type TrackReference, VideoTrack } from '@livekit/components-react';
import { cn } from '@/lib/utils';

interface AgentAudioTileProps {
  videoTrack: TrackReference;
  className?: string;
}

export const AvatarTile = ({
  videoTrack,
  className,
  ref,
}: React.ComponentProps<'div'> & AgentAudioTileProps) => {
  return (
    <div 
      ref={ref} 
      className={cn('flex items-center justify-center aspect-square', className)}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <VideoTrack
        trackRef={videoTrack}
        width={videoTrack?.publication.dimensions?.width ?? 0}
        height={videoTrack?.publication.dimensions?.height ?? 0}
        className="rounded-full object-cover"
      />
    </div>
  );
};
