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
                        <div className="text-2xl font-bold">TechCo</div>
                        <div className="hidden gap-8 md:flex">
                            <a href="#home" className="text-sm font-medium transition-colors hover:text-primary">Home</a>
                            <a href="#about" className="text-sm font-medium transition-colors hover:text-primary">About</a>
                            <a href="#services" className="text-sm font-medium transition-colors hover:text-primary">Services</a>
                            <a href="#contact" className="text-sm font-medium transition-colors hover:text-primary">Contact</a>
                        </div>
                    </div>
                </motion.nav>

                {/* Hero Section */}
                <section id="home" className="flex min-h-screen items-center justify-center px-6 pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="mx-auto max-w-5xl text-center"
                    >
                        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                            Transform Your Digital Experience
                        </h1>
                        <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                            We help businesses innovate and grow with cutting-edge technology solutions tailored to your unique needs.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: '#29B6F6' }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition-all"
                            style={{
                                backgroundColor: '#4FC3F7',
                                color: '#FFFFFF',
                            }}
                        >
                            Get Started Today
                        </motion.button>
                    </motion.div>
                </section>

                {/* Services Section */}
                <section id="services" className="bg-muted/30 px-6 py-24">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="mb-16 text-center"
                        >
                            <h2 className="mb-4 text-4xl font-bold md:text-5xl">Our Services</h2>
                            <p className="text-lg text-muted-foreground">
                                Comprehensive solutions designed to elevate your business
                            </p>
                        </motion.div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    title: 'Web Development',
                                    description: 'Build modern, responsive websites that engage your audience and drive results.',
                                    icon: '🌐'
                                },
                                {
                                    title: 'Mobile Apps',
                                    description: 'Create seamless mobile experiences for iOS and Android platforms.',
                                    icon: '📱'
                                },
                                {
                                    title: 'Cloud Solutions',
                                    description: 'Leverage the power of cloud computing for scalability and reliability.',
                                    icon: '☁️'
                                },
                                {
                                    title: 'Consulting',
                                    description: 'Strategic guidance to help you make informed technology decisions.',
                                    icon: '💡'
                                }
                            ].map((service, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:shadow-lg"
                                >
                                    <div className="mb-4 text-5xl">{service.icon}</div>
                                    <h3 className="mb-3 text-xl font-semibold">{service.title}</h3>
                                    <p className="text-muted-foreground">{service.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="px-6 py-24">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid items-center gap-12 md:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="mb-6 text-4xl font-bold md:text-5xl">About Our Company</h2>
                                <p className="mb-4 text-lg text-muted-foreground">
                                    With over a decade of experience, we've been at the forefront of digital innovation, helping businesses of all sizes achieve their goals through technology.
                                </p>
                                <p className="mb-6 text-lg text-muted-foreground">
                                    Our team of experts is dedicated to delivering exceptional results, combining technical excellence with creative problem-solving to bring your vision to life.
                                </p>
                                <div className="flex gap-8">
                                    <div>
                                        <div className="mb-2 text-3xl font-bold text-primary">500+</div>
                                        <div className="text-sm text-muted-foreground">Projects Completed</div>
                                    </div>
                                    <div>
                                        <div className="mb-2 text-3xl font-bold text-primary">50+</div>
                                        <div className="text-sm text-muted-foreground">Team Members</div>
                                    </div>
                                    <div>
                                        <div className="mb-2 text-3xl font-bold text-primary">98%</div>
                                        <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-12"
                            >
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-center">
                                        <div className="mb-4 text-8xl">🚀</div>
                                        <p className="text-lg font-semibold">Innovation Driven</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="bg-muted/30 px-6 py-24">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="mb-16 text-center"
                        >
                            <h2 className="mb-4 text-4xl font-bold md:text-5xl">What Our Clients Say</h2>
                            <p className="text-lg text-muted-foreground">
                                Don't just take our word for it
                            </p>
                        </motion.div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    quote: "Working with this team has been transformative for our business. Their expertise and dedication are unmatched.",
                                    author: "Sarah Johnson",
                                    role: "CEO, TechStart Inc."
                                },
                                {
                                    quote: "The quality of work and attention to detail exceeded our expectations. Highly recommend their services!",
                                    author: "Michael Chen",
                                    role: "CTO, InnovateLabs"
                                },
                                {
                                    quote: "Professional, reliable, and innovative. They delivered exactly what we needed, on time and on budget.",
                                    author: "Emily Rodriguez",
                                    role: "Founder, Digital Dynamics"
                                }
                            ].map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="rounded-2xl border border-border bg-background p-8 shadow-sm"
                                >
                                    <div className="mb-6 text-4xl text-primary">"</div>
                                    <p className="mb-6 text-muted-foreground">{testimonial.quote}</p>
                                    <div>
                                        <div className="font-semibold">{testimonial.author}</div>
                                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
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
                                <div className="mb-4 text-2xl font-bold">TechCo</div>
                                <p className="mb-4 text-muted-foreground">
                                    Empowering businesses through innovative technology solutions since 2013.
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    <p>123 Innovation Street</p>
                                    <p>San Francisco, CA 94105</p>
                                    <p className="mt-2">contact@techco.example</p>
                                    <p>+1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Company</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><a href="#about" className="transition-colors hover:text-foreground">About Us</a></li>
                                    <li><a href="#services" className="transition-colors hover:text-foreground">Services</a></li>
                                    <li><a href="#" className="transition-colors hover:text-foreground">Careers</a></li>
                                    <li><a href="#" className="transition-colors hover:text-foreground">Blog</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Legal</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li><a href="#" className="transition-colors hover:text-foreground">Privacy Policy</a></li>
                                    <li><a href="#" className="transition-colors hover:text-foreground">Terms of Service</a></li>
                                    <li><a href="#" className="transition-colors hover:text-foreground">Cookie Policy</a></li>
                                    <li><a href="#" className="transition-colors hover:text-foreground">GDPR</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
                            <p>© {new Date().getFullYear()} TechCo. All rights reserved.</p>
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
                            'flex h-18 w-18 items-center justify-center rounded-full shadow-lg transition-colors overflow-hidden border-2 border-white',
                            isOpen
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-shine'
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
                                    <img 
                                        src="/button-icon.png" 
                                        alt="Chat" 
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                    {!isOpen && (
                        <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity dark:bg-gray-700">
                            Ask a question!
                            <div className="absolute left-full top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900 dark:bg-gray-700" />
                        </div>
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

