'use client';

import { toastAlert } from '@/components/alert-toast';
import { Toaster } from '@/components/ui/sonner';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { ChatCircle, X } from '@phosphor-icons/react/dist/ssr';
import { Room, RoomEvent } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { SessionView } from './session-view';

interface FloatingBotProps {
    appConfig: AppConfig;
}

export function FloatingBot({ appConfig }: FloatingBotProps) {
    const room = useMemo(() => new Room(), []);
    const [isOpen, setIsOpen] = useState(false);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(appConfig.defaultTTSVoice || '');
    const { refreshConnectionDetails, existingOrRefreshConnectionDetails } =
        useConnectionDetails(appConfig);

    useEffect(() => {
        const onDisconnected = () => {
            setSessionStarted(false);
            setIsOpen(false);
            refreshConnectionDetails();
        };
        const onMediaDevicesError = (error: Error) => {
            toastAlert({
                title: 'Encountered an error with your media devices',
                description: `${error.name}: ${error.message}`,
            });
        };
        room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
        room.on(RoomEvent.Disconnected, onDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, onDisconnected);
            room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
        };
    }, [room, refreshConnectionDetails]);

    useEffect(() => {
        let aborted = false;
        if (sessionStarted && room.state === 'disconnected') {
            Promise.all([
                room.localParticipant.setMicrophoneEnabled(true, undefined, {
                    preConnectBuffer: appConfig.isPreConnectBufferEnabled,
                }),
                existingOrRefreshConnectionDetails().then((connectionDetails) =>
                    room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
                ),
            ]).catch((error) => {
                if (aborted) {
                    return;
                }

                toastAlert({
                    title: 'There was an error connecting to the agent',
                    description: `${error.name}: ${error.message}`,
                });
            });
        }
        return () => {
            aborted = true;
            room.disconnect();
        };
    }, [room, sessionStarted, appConfig.isPreConnectBufferEnabled, existingOrRefreshConnectionDetails]);

    // Send voice selection to agent when session starts
    useEffect(() => {
        if (sessionStarted && room.state === 'connected' && selectedVoice) {
            // Send voice configuration to agent via data message
            room.localParticipant.publishData(
                JSON.stringify({
                    type: 'voice_config',
                    voice: selectedVoice
                }),
                { reliable: true }
            );
        }
    }, [sessionStarted, room.state, selectedVoice, room.localParticipant]);

    const handleToggle = () => {
        if (!isOpen) {
            setIsOpen(true);
            // Start session when opening the popup
            if (!sessionStarted) {
                setSessionStarted(true);
            }
        } else {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Background Content */}
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl space-y-6"
                >
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mx-auto text-foreground"
                    >
                        <path
                            d="M15 24V40C15 40.7957 14.6839 41.5587 14.1213 42.1213C13.5587 42.6839 12.7956 43 12 43C11.2044 43 10.4413 42.6839 9.87868 42.1213C9.31607 41.5587 9 40.7957 9 40V24C9 23.2044 9.31607 22.4413 9.87868 21.8787C10.4413 21.3161 11.2044 21 12 21C12.7956 21 13.5587 21.3161 14.1213 21.8787C14.6839 22.4413 15 23.2044 15 24ZM22 5C21.2044 5 20.4413 5.31607 19.8787 5.87868C19.3161 6.44129 19 7.20435 19 8V56C19 56.7957 19.3161 57.5587 19.8787 58.1213C20.4413 58.6839 21.2044 59 22 59C22.7956 59 23.5587 58.6839 24.1213 58.1213C24.6839 57.5587 25 56.7957 25 56V8C25 7.20435 24.6839 6.44129 24.1213 5.87868C23.5587 5.31607 22.7956 5 22 5ZM32 13C31.2044 13 30.4413 13.3161 29.8787 13.8787C29.3161 14.4413 29 15.2044 29 16V48C29 48.7957 29.3161 49.5587 29.8787 50.1213C30.4413 50.6839 31.2044 51 32 51C32.7956 51 33.5587 50.6839 34.1213 50.1213C34.6839 49.5587 35 48.7957 35 48V16C35 15.2044 34.6839 14.4413 34.1213 13.8787C33.5587 13.3161 32.7956 13 32 13ZM42 21C41.2043 21 40.4413 21.3161 39.8787 21.8787C39.3161 22.4413 39 23.2044 39 24V40C39 40.7957 39.3161 41.5587 39.8787 42.1213C40.4413 42.6839 41.2043 43 42 43C42.7957 43 43.5587 42.6839 44.1213 42.1213C44.6839 41.5587 45 40.7957 45 40V24C45 23.2044 44.6839 22.4413 44.1213 21.8787C43.5587 21.3161 42.7957 21 42 21ZM52 17C51.2043 17 50.4413 17.3161 49.8787 17.8787C49.3161 18.4413 49 19.2044 49 20V44C49 44.7957 49.3161 45.5587 49.8787 46.1213C50.4413 46.6839 51.2043 47 52 47C52.7957 47 53.5587 46.6839 54.1213 46.1213C54.6839 45.5587 55 44.7957 55 44V20C55 19.2044 54.6839 18.4413 54.1213 17.8787C53.5587 17.3161 52.7957 17 52 17Z"
                            fill="currentColor"
                        />
                    </svg>

                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                        {appConfig.pageTitle || 'Voice AI Agent'}
                    </h1>

                    <p className="text-lg text-muted-foreground md:text-xl">
                        {appConfig.pageDescription || 'Click the button below to start chatting with your AI assistant'}
                    </p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                    >
                        <ChatCircle size={20} weight="duotone" />
                        <span>Click the chat button in the bottom right to begin</span>
                    </motion.div>
                </motion.div>
            </div>

            {/* Floating Action Button */}
            <motion.button
                onClick={handleToggle}
                className={cn(
                    'fixed right-6 bottom-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors',
                    isOpen
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X size={24} weight="bold" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChatCircle size={24} weight="bold" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Popup Container */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-[98] bg-black/50 backdrop-blur-sm"
                            onClick={handleToggle}
                        />

                        {/* Popup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="fixed left-1/2 top-1/2 z-[99] h-[85vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
                            style={{
                                maxHeight: 'calc(100vh - 80px)',
                                maxWidth: 'calc(100vw - 80px)',
                            }}
                        >
                            <RoomContext.Provider value={room}>
                                <RoomAudioRenderer />
                                <StartAudio label="Start Audio" />
                                <SessionView
                                    appConfig={appConfig}
                                    disabled={!sessionStarted}
                                    sessionStarted={sessionStarted}
                                    isPopupMode={true}
                                    selectedVoice={selectedVoice}
                                    onVoiceChange={setSelectedVoice}
                                />
                            </RoomContext.Provider>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Toaster />
        </>
    );
}

