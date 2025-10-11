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

// Avatar Slideshow Component
function AvatarSlideshow() {
    const avatarImages = [
        '/button-icon2.png',
        '/button-icon3.png',
        '/button-icon4.png',
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex: number) => (prevIndex + 1) % avatarImages.length);
        }, 4500); // Change image every 4.5 seconds

        return () => clearInterval(interval);
    }, [avatarImages.length]);

    return (
        <div className="relative w-60 h-60">
            {avatarImages.map((src, index) => (
                <motion.div
                    key={src}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: currentIndex === index ? 1 : 0,
                        scale: currentIndex === index ? [1, 1.05, 1] : 1,
                        x: currentIndex === index ? [0, -2, 2, 0] : 0,
                        y: currentIndex === index ? [0, -2, 2, 0] : 0,
                    }}
                    transition={{
                        opacity: { duration: 0.75, ease: 'easeInOut' },
                        scale: { duration: 5, ease: 'easeInOut', repeat: Infinity },
                        x: { duration: 8, ease: 'easeInOut', repeat: Infinity },
                        y: { duration: 9, ease: 'easeInOut', repeat: Infinity },
                    }}
                >
                    <img
                        src={src}
                        alt={`AI Avatar ${index + 1}`}
                        className="w-full h-full rounded-full object-cover"
                        style={{
                            boxShadow: '0 10px 40px rgba(239, 59, 86, 0.3)',
                        }}
                    />
                </motion.div>
            ))}
        </div>
    );
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
            {/* Background Content - Landing Page */}
            <div className="min-h-screen bg-background">
                {/* Navigation Bar */}
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md"
                >
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img src="/demis2.png" alt="DemisCo AI Logo" className="h-8 w-8" />
                            <div className="text-2xl font-bold">
                                DemisCo <span style={{ color: 'var(--secondary-blue)' }}>AI</span>
                            </div>
                        </div>
                        <div className="hidden gap-8 md:flex">
                            <a href="#home" className="nav-link text-sm font-medium transition-colors hover:text-primary">Home</a>
                            <a href="#features" className="nav-link text-sm font-medium transition-colors hover:text-primary">Features</a>
                            <a href="#avatar" className="nav-link text-sm font-medium transition-colors hover:text-primary">Your Avatar</a>
                            <a href="#contact" className="nav-link text-sm font-medium transition-colors hover:text-primary">Contact</a>
                        </div>
                    </div>
                </motion.nav>

                {/* Hero Section */}
                <section id="home" className="flex min-h-screen items-center justify-center px-6 pt-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid items-center gap-12 md:grid-cols-2">
                            {/* Text Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="text-center md:text-left"
                            >
                                <motion.h1 
                                    className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                >
                                    Meet the Future of Digital Interaction
                                </motion.h1>
                                <motion.p 
                                    className="mb-8 text-lg text-muted-foreground md:text-xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.5 }}
                                >
                                    Introducing the DemisCo AI voice assistant. Your personalized avatar, designed to boost productivity and simplify your daily tasks.
                                </motion.p>
                                <motion.button
                                    onClick={handleToggle}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-all"
                                    style={{
                                        backgroundColor: 'var(--primary-red)',
                                        color: 'var(--text-white)',
                                        boxShadow: '0 10px 30px rgba(239, 59, 86, 0.3)',
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.7 }}
                                >
                                    Try the Live Demo
                                </motion.button>
                            </motion.div>

                            {/* Avatar Visualization */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="relative flex items-center justify-center"
                            >
                                <div className="relative">
                                    {/* Animated Avatar Circle */}
                                    <motion.div
                                        className="relative flex h-80 w-80 items-center justify-center rounded-full"
                                        style={{
                                            background: `linear-gradient(135deg, var(--primary-red) 0%, var(--secondary-blue) 100%)`,
                                            boxShadow: '0 20px 60px rgba(239, 59, 86, 0.4)',
                                        }}
                                        animate={{
                                            boxShadow: [
                                                '0 20px 60px rgba(239, 59, 86, 0.4)',
                                                '0 20px 80px rgba(102, 155, 209, 0.6)',
                                                '0 20px 60px rgba(239, 59, 86, 0.4)',
                                            ],
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        {/* Inner Circle */}
                                        <motion.div
                                            className="flex h-72 w-72 items-center justify-center rounded-full bg-background"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                        >
                                            {/* Avatar Icon/Representation */}
                                            <motion.div
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <AvatarSlideshow />
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                    
                                    {/* Floating Orbs */}
                                    <motion.div
                                        className="absolute -left-8 top-20 h-16 w-16 rounded-full"
                                        style={{ backgroundColor: 'var(--secondary-blue)', opacity: 0.3 }}
                                        animate={{
                                            y: [-10, 10, -10],
                                            x: [-5, 5, -5],
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                    <motion.div
                                        className="absolute -right-8 bottom-20 h-12 w-12 rounded-full"
                                        style={{ backgroundColor: 'var(--primary-red)', opacity: 0.3 }}
                                        animate={{
                                            y: [10, -10, 10],
                                            x: [5, -5, 5],
                                        }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="px-6 py-24" style={{ backgroundColor: 'var(--bg1)' }}>
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="mb-16 text-center"
                        >
                            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
                                Powerful Features for Your Success
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Discover what makes DemisCo AI Assistant the perfect companion for your daily workflow
                            </p>
                        </motion.div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    title: 'Fully Customizable Avatar',
                                    description: 'Create an avatar that looks just like you or reflects your brand\'s personality. From appearance to voice, everything is adjustable.',
                                    icon: (
                                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="8" y="8" width="48" height="48" rx="8" stroke="var(--secondary-blue)" strokeWidth="3" fill="none"/>
                                            <circle cx="32" cy="24" r="8" fill="var(--secondary-blue)" opacity="0.3"/>
                                            <path d="M20 44C20 36 26 32 32 32C38 32 44 36 44 44" stroke="var(--secondary-blue)" strokeWidth="3" strokeLinecap="round"/>
                                            <circle cx="48" cy="16" r="4" fill="var(--primary-red)"/>
                                            <path d="M52 12L56 8M56 16L52 12" stroke="var(--primary-red)" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    )
                                },
                                {
                                    title: 'Advanced Natural Language Understanding',
                                    description: 'DemisCo understands complex conversations, answers your questions, and executes tasks with human-like precision.',
                                    icon: (
                                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8 32C8 18.7 18.7 8 32 8C45.3 8 56 18.7 56 32C56 45.3 45.3 56 32 56C18.7 56 8 45.3 8 32Z" stroke="var(--secondary-blue)" strokeWidth="3" fill="none"/>
                                            <path d="M16 28C16 28 20 32 24 32C28 32 32 24 36 24C40 24 44 28 48 28" stroke="var(--secondary-blue)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                                            <path d="M16 36C16 36 20 40 24 40C28 40 32 32 36 32C40 32 44 36 48 36" stroke="var(--primary-red)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
                                            <circle cx="24" cy="20" r="2" fill="var(--primary-red)"/>
                                            <circle cx="40" cy="16" r="2" fill="var(--primary-red)"/>
                                        </svg>
                                    )
                                },
                                {
                                    title: 'Seamless Integration',
                                    description: 'Connect your assistant to your calendar, email, and other productivity tools to maximize your efficiency.',
                                    icon: (
                                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="12" y="12" width="20" height="20" rx="4" fill="var(--secondary-blue)" opacity="0.3"/>
                                            <rect x="36" y="12" width="16" height="16" rx="4" stroke="var(--secondary-blue)" strokeWidth="2" fill="none"/>
                                            <rect x="12" y="36" width="16" height="16" rx="4" stroke="var(--secondary-blue)" strokeWidth="2" fill="none"/>
                                            <rect x="32" y="32" width="20" height="20" rx="4" fill="var(--primary-red)" opacity="0.3"/>
                                            <circle cx="32" cy="32" r="6" fill="var(--primary-red)"/>
                                            <line x1="20" y1="22" x2="26" y2="28" stroke="var(--secondary-blue)" strokeWidth="2"/>
                                            <line x1="38" y1="28" x2="38" y2="26" stroke="var(--secondary-blue)" strokeWidth="2"/>
                                            <line x1="26" y1="38" x2="26" y2="36" stroke="var(--secondary-blue)" strokeWidth="2"/>
                                        </svg>
                                    )
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.15 }}
                                    viewport={{ once: true }}
                                    className="group rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:shadow-xl hover:scale-105"
                                    style={{
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <motion.div 
                                        className="mb-6 flex items-center justify-center"
                                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {feature.icon}
                                    </motion.div>
                                    <h3 className="mb-4 text-xl font-semibold">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Avatar in Action Section */}
                <section id="avatar" className="px-6 py-24">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="mb-16 text-center"
                        >
                            <h2 className="mb-4 text-4xl font-bold md:text-5xl">See Your Avatar in Action</h2>
                            <p className="text-lg text-muted-foreground">
                                Watch how DemisCo AI responds to your commands with intelligence and personality
                            </p>
                        </motion.div>

                        <div className="grid items-center gap-12 md:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="space-y-6"
                            >
                                <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                    <div className="mb-3 flex items-center gap-3">
                                        <div 
                                            className="flex h-10 w-10 items-center justify-center rounded-full"
                                            style={{ backgroundColor: 'var(--primary-red)', color: 'white' }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 6C11.1 6 12 6.9 12 8C12 9.1 11.1 10 10 10C8.9 10 8 9.1 8 8C8 6.9 8.9 6 10 6ZM10 16C8 16 6.24 14.97 5.5 13.4C5.53 11.79 8 10.9 10 10.9C12 10.9 14.47 11.79 14.5 13.4C13.76 14.97 12 16 10 16Z" fill="currentColor"/>
                                            </svg>
                                        </div>
                                        <span className="font-semibold">You</span>
                                    </div>
                                    <p className="text-muted-foreground">"What's my next meeting?"</p>
                                </div>

                                <motion.div
                                    className="rounded-xl border-2 bg-card p-6 shadow-sm"
                                    style={{ borderColor: 'var(--secondary-blue)' }}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div 
                                            className="flex h-10 w-10 items-center justify-center rounded-full"
                                            style={{ backgroundColor: 'var(--secondary-blue)', color: 'white' }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="10" cy="10" r="8" fill="currentColor"/>
                                                <circle cx="7" cy="9" r="1.5" fill="white"/>
                                                <circle cx="13" cy="9" r="1.5" fill="white"/>
                                            </svg>
                                        </div>
                                        <span className="font-semibold" style={{ color: 'var(--secondary-blue)' }}>DemisCo AI</span>
                                    </div>
                                    <p className="text-muted-foreground">
                                        "Your next meeting is at 3:00 PM with the Marketing Team to discuss Q4 campaigns. 
                                        Would you like me to prepare a summary of last week's analytics for the meeting?"
                                    </p>
                                </motion.div>

                                <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                    <div className="mb-3 flex items-center gap-3">
                                        <div 
                                            className="flex h-10 w-10 items-center justify-center rounded-full"
                                            style={{ backgroundColor: 'var(--primary-red)', color: 'white' }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 6C11.1 6 12 6.9 12 8C12 9.1 11.1 10 10 10C8.9 10 8 9.1 8 8C8 6.9 8.9 6 10 6ZM10 16C8 16 6.24 14.97 5.5 13.4C5.53 11.79 8 10.9 10 10.9C12 10.9 14.47 11.79 14.5 13.4C13.76 14.97 12 16 10 16Z" fill="currentColor"/>
                                            </svg>
                                        </div>
                                        <span className="font-semibold">You</span>
                                    </div>
                                    <p className="text-muted-foreground">"Yes, please. Also send an email to the team."</p>
                                </div>

                                <motion.div
                                    className="rounded-xl border-2 bg-card p-6 shadow-sm"
                                    style={{ borderColor: 'var(--secondary-blue)' }}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div 
                                            className="flex h-10 w-10 items-center justify-center rounded-full"
                                            style={{ backgroundColor: 'var(--secondary-blue)', color: 'white' }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="10" cy="10" r="8" fill="currentColor"/>
                                                <circle cx="7" cy="9" r="1.5" fill="white"/>
                                                <circle cx="13" cy="9" r="1.5" fill="white"/>
                                            </svg>
                                        </div>
                                        <span className="font-semibold" style={{ color: 'var(--secondary-blue)' }}>DemisCo AI</span>
                                    </div>
                                    <p className="text-muted-foreground">
                                        "Done! I've prepared the analytics summary and sent it to all team members. 
                                        Is there anything else you'd like me to help with?"
                                    </p>
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="rounded-2xl p-12"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(239, 59, 86, 0.1) 0%, rgba(102, 155, 209, 0.1) 100%)',
                                    border: '2px solid var(--border)',
                                }}
                            >
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.05, 1],
                                            rotate: [0, 5, -5, 0],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                        className="mb-6"
                                    >
                                        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="80" cy="80" r="70" fill="var(--primary-red)" opacity="0.1"/>
                                            <circle cx="80" cy="80" r="60" stroke="var(--secondary-blue)" strokeWidth="3" fill="none" opacity="0.5"/>
                                            <circle cx="80" cy="60" r="20" fill="var(--secondary-blue)" opacity="0.3"/>
                                            <path d="M50 100C50 85 62 75 80 75C98 75 110 85 110 100" stroke="var(--secondary-blue)" strokeWidth="4" strokeLinecap="round"/>
                                            <motion.circle
                                                cx="70"
                                                cy="60"
                                                r="5"
                                                fill="var(--primary-red)"
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            <motion.circle
                                                cx="90"
                                                cy="60"
                                                r="5"
                                                fill="var(--primary-red)"
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                            />
                                            <motion.path
                                                d="M40 80 L60 85 L55 90"
                                                stroke="var(--secondary-blue)"
                                                strokeWidth="2"
                                                fill="none"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <motion.path
                                                d="M120 80 L100 85 L105 90"
                                                stroke="var(--secondary-blue)"
                                                strokeWidth="2"
                                                fill="none"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                            />
                                        </svg>
                                    </motion.div>
                                    <h3 className="mb-3 text-2xl font-bold">Intelligent & Responsive</h3>
                                    <p className="text-muted-foreground">
                                        Your avatar learns from every interaction, providing increasingly personalized and accurate assistance
                                    </p>
                                    <motion.button
                                        onClick={handleToggle}
                                        className="mt-6 rounded-full px-6 py-3 font-semibold transition-all"
                                        style={{
                                            backgroundColor: 'var(--primary-red)',
                                            color: 'white',
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Try It Now
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="px-6 py-24" style={{ backgroundColor: 'var(--bg1)' }}>
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="mb-16 text-center"
                        >
                            <h2 className="mb-4 text-4xl font-bold md:text-5xl">Loved by Professionals</h2>
                            <p className="text-lg text-muted-foreground">
                                See how DemisCo AI is transforming workflows across industries
                            </p>
                        </motion.div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    quote: "DemisCo AI has revolutionized how I manage my day. It's like having a personal assistant who truly understands my needs.",
                                    author: "Sarah Mitchell",
                                    role: "Product Manager, TechFlow"
                                },
                                {
                                    quote: "The natural language understanding is incredible. I can have real conversations with my avatar, and it always gets it right.",
                                    author: "David Park",
                                    role: "Entrepreneur"
                                },
                                {
                                    quote: "Customizing my avatar to match our brand was seamless. Our clients love interacting with our AI representative!",
                                    author: "Emma Williams",
                                    role: "CEO, BrandVision"
                                }
                            ].map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="rounded-2xl border-2 bg-background p-8 shadow-sm transition-all hover:shadow-lg"
                                    style={{ borderColor: 'var(--border)' }}
                                >
                                    <div className="mb-6 text-5xl font-bold" style={{ color: 'var(--primary-red)' }}>"</div>
                                    <p className="mb-6 text-muted-foreground leading-relaxed">{testimonial.quote}</p>
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
                                            style={{ backgroundColor: 'var(--secondary-blue)' }}
                                        >
                                            {testimonial.author.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{testimonial.author}</div>
                                            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer id="contact" className="border-t border-border bg-background px-6 py-16">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-12 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <div className="mb-4 text-2xl font-bold">
                                    DemisCo <span style={{ color: 'var(--secondary-blue)' }}>AI</span>
                                </div>
                                <p className="mb-4 text-muted-foreground">
                                    Empowering individuals and businesses with intelligent AI assistants that understand, learn, and adapt to your unique needs.
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    <p>AI Innovation Hub</p>
                                    <p>Silicon Valley, CA</p>
                                    <p className="mt-2">hello@demisco.ai</p>
                                    <p>support@demisco.ai</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Product</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><a href="#features" className="transition-colors hover:text-primary">Features</a></li>
                                    <li><a href="#avatar" className="transition-colors hover:text-primary">Your Avatar</a></li>
                                    <li><a href="#" className="transition-colors hover:text-primary">Pricing</a></li>
                                    <li><a href="#" className="transition-colors hover:text-primary">API Documentation</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Legal</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><a href="#" className="transition-colors hover:text-primary">Privacy Policy</a></li>
                                    <li><a href="#" className="transition-colors hover:text-primary">Terms of Service</a></li>
                                    <li><a href="#" className="transition-colors hover:text-primary">Cookie Policy</a></li>
                                    <li><a href="#" className="transition-colors hover:text-primary">AI Ethics</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-8 text-center">
                            <div className="flex gap-4">
                                <motion.a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                                    style={{ backgroundColor: 'var(--bg2)' }}
                                    whileHover={{ scale: 1.1, backgroundColor: 'var(--primary-red)' }}
                                >
                                    <span className="text-sm">𝕏</span>
                                </motion.a>
                                <motion.a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                                    style={{ backgroundColor: 'var(--bg2)' }}
                                    whileHover={{ scale: 1.1, backgroundColor: 'var(--secondary-blue)' }}
                                >
                                    <span className="text-sm">in</span>
                                </motion.a>
                                <motion.a
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                                    style={{ backgroundColor: 'var(--bg2)' }}
                                    whileHover={{ scale: 1.1, backgroundColor: 'var(--primary-red)' }}
                                >
                                    <span className="text-sm">▶</span>
                                </motion.a>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                © {new Date().getFullYear()} DemisCo AI Assistant. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Floating Action Button */}
            <div className="fixed right-6 bottom-6 z-[100]">
                <div className="relative inline-block group">
                    <motion.button
                        onClick={handleToggle}
                        className={cn(
                            'flex h-18 w-18 items-center justify-center rounded-full shadow-2xl transition-all overflow-hidden border-2',
                            isOpen
                                ? 'border-border'
                                : 'border-white'
                        )}
                        style={{
                            backgroundColor: isOpen ? 'var(--primary-red)' : 'var(--primary-red)',
                            boxShadow: isOpen 
                                ? '0 10px 40px rgba(239, 59, 86, 0.5)' 
                                : '0 10px 40px rgba(239, 59, 86, 0.6)',
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        animate={!isOpen ? {
                            boxShadow: [
                                '0 10px 40px rgba(239, 59, 86, 0.6)',
                                '0 10px 50px rgba(239, 59, 86, 0.8)',
                                '0 10px 40px rgba(239, 59, 86, 0.6)',
                            ],
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
                                    className="text-white"
                                >
                                    <X size={28} weight="bold" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="open"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-center w-full h-full"
                                >
                                    <motion.img 
                                        src="/button-icon.png" 
                                        alt="Chat" 
                                        className="w-full h-full object-cover rounded-full"
                                        animate={{ scale: [1, 1.08, 1] }}
                                        transition={{ 
                                            duration: 2.5, 
                                            repeat: Infinity, 
                                            ease: 'easeInOut',
                                            repeatType: 'loop'
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                    {!isOpen && (
                        <motion.div 
                            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: 'var(--secondary-blue)' }}
                        >
                            Chat with DemisCo AI!
                            <div className="absolute left-full top-1/2 -ml-1 h-3 w-3 -translate-y-1/2 rotate-45" style={{ backgroundColor: 'var(--secondary-blue)' }} />
                        </motion.div>
                    )}
                </div>
            </div>

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

