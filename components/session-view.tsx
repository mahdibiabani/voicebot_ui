'use client';

import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  isPopupMode?: boolean;
  selectedVoice?: string;
  onVoiceChange?: (voice: string) => void;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  isPopupMode = false,
  selectedVoice,
  onVoiceChange,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const { messages: liveMessages, send } = useChatAndTranscription();
  const room = useRoomContext();

  // Mock data for testing UI (remove in production)
  const mockMessages: ReceivedChatMessage[] = [
    {
      id: 'mock-1',
      timestamp: Date.now() - 60000,
      message: 'Hello! How can I help you today?',
      from: {
        identity: 'agent',
        name: 'AI Assistant',
        isLocal: false,
      } as any,
    },
    {
      id: 'mock-2',
      timestamp: Date.now() - 50000,
      message: 'Hi! I would like to know more about your services.',
      from: {
        identity: 'user',
        name: 'User',
        isLocal: true,
      } as any,
    },
    {
      id: 'mock-3',
      timestamp: Date.now() - 40000,
      message: 'Great question! We offer a variety of AI-powered voice assistance services. What specific area are you interested in?',
      from: {
        identity: 'agent',
        name: 'AI Assistant',
        isLocal: false,
      } as any,
    },
    {
      id: 'mock-4',
      timestamp: Date.now() - 30000,
      message: 'I\'m interested in voice recognition and transcription features.',
      from: {
        identity: 'user',
        name: 'User',
        isLocal: true,
      } as any,
    },
    {
      id: 'mock-5',
      timestamp: Date.now() - 20000,
      message: '[TRANSCRIPTION] Can you also tell me about real-time speech processing?',
      from: {
        identity: 'user',
        name: 'User',
        isLocal: true,
      } as any,
    },
    {
      id: 'mock-6',
      timestamp: Date.now() - 10000,
      message: 'Absolutely! Our real-time speech processing uses advanced machine learning models to transcribe and understand speech with high accuracy. It supports multiple languages and can handle various accents. The system processes audio in near real-time with minimal latency.',
      from: {
        identity: 'agent',
        name: 'AI Assistant',
        isLocal: false,
      } as any,
    },
    {
      id: 'mock-7',
      timestamp: Date.now() - 5000,
      message: '[TRANSCRIPTION] That sounds amazing! What about pricing?',
      from: {
        identity: 'user',
        name: 'User',
        isLocal: true,
      } as any,
    },
    {
      id: 'mock-8',
      timestamp: Date.now() - 2000,
      message: 'We offer flexible pricing plans to suit different needs. You can choose from pay-as-you-go options or monthly subscriptions. Would you like me to send you detailed pricing information?',
      from: {
        identity: 'agent',
        name: 'AI Assistant',
        isLocal: false,
      } as any,
    },
  ];

  // Use mock data for preview, real messages otherwise
  const messages = liveMessages.length > 0 ? liveMessages : mockMessages;

  // Track if user is speaking (agent is listening)
  const isUserSpeaking = agentState === 'listening';

  // Auto-open chat when there are mock messages for preview
  useEffect(() => {
    if (sessionStarted && messages.length > 0 && liveMessages.length === 0) {
      setChatOpen(true);
    }
  }, [sessionStarted, messages.length, liveMessages.length]);

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  async function handleSendMessage(message: string) {
    await send(message);
  }

  // When user speaks, close chat mode to show centered waveform
  useEffect(() => {
    if (isPopupMode && chatOpen && isUserSpeaking) {
      setChatOpen(false);
    }
  }, [isUserSpeaking, isPopupMode, chatOpen]);

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  if (isPopupMode) {
    return (
      <section
        ref={ref}
        inert={disabled}
        className="relative flex h-full w-full flex-col overflow-hidden"
      >
        {/* Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Chat Messages - only shown when chatOpen */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-30 flex flex-col bg-background"
              >
                <ChatMessageView className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
                  <div className="space-y-3 whitespace-pre-wrap">
                    <AnimatePresence>
                      {messages.map((message: ReceivedChatMessage) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                          <ChatEntry hideName key={message.id} entry={message} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ChatMessageView>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent Tile - smoothly transitions between center and corner */}
          <motion.div
            className="absolute z-50"
            initial={false}
            animate={{
              left: chatOpen ? 'calc(100% - 144px)' : '50%',
              top: chatOpen ? 'calc(100% - 144px)' : '50%',
              x: chatOpen ? 0 : '-50%',
              y: chatOpen ? 0 : '-50%',
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 28,
              mass: 0.8,
            }}
          >
            <MediaTiles chatOpen={chatOpen} isPopupMode={isPopupMode} />
          </motion.div>

          {/* Helper text - only shown when not in chat mode */}
          {!chatOpen && appConfig.isPreConnectBufferEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                transition: {
                  ease: 'easeIn',
                  delay: messages.length > 0 ? 0 : 0.8,
                  duration: messages.length > 0 ? 0.2 : 0.5,
                },
              }}
              aria-hidden={messages.length > 0}
              className="absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-muted-foreground"
            >
              <p className="animate-text-shimmer inline-block !bg-clip-text font-semibold text-transparent">
                Agent is listening, ask it a question or type below
              </p>
            </motion.div>
          )}
        </div>

        {/* Control Bar - Always at Bottom */}
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
          className="relative border-t border-border bg-background p-3"
        >
          <AgentControlBar
            capabilities={capabilities}
            onChatOpenChange={setChatOpen}
            onSendMessage={handleSendMessage}
          />
        </motion.div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'opacity-0',
        // prevent page scrollbar
        // when !chatOpen due to 'translate-y-20'
        !chatOpen && 'max-h-svh overflow-hidden'
      )}
    >
      <ChatMessageView
        className={cn(
          'mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48',
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-3 whitespace-pre-wrap">
          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <ChatEntry hideName key={message.id} entry={message} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      <div className="bg-background mp-12 fixed top-0 right-0 left-0 h-32 md:h-36">
        {/* skrim */}
        <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
      </div>

      <MediaTiles chatOpen={chatOpen} />

      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                  Agent is listening, ask it a question
                </p>
              </motion.div>
            )}

            <AgentControlBar
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
            />
          </div>
          {/* skrim */}
          <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};
