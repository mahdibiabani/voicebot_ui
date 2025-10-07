'use client';

import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import type { ReceivedChatMessage } from '@livekit/components-react';

// Mock chat messages with both user and AI messages
const mockMessages: ReceivedChatMessage[] = [
    {
        id: '1',
        timestamp: Date.now() - 60000,
        message: 'Hello! How can I help you today?',
        from: {
            identity: 'agent',
            name: 'AI Assistant',
            isLocal: false,
        } as any,
    },
    {
        id: '2',
        timestamp: Date.now() - 50000,
        message: 'Hi! I would like to know more about your services.',
        from: {
            identity: 'user',
            name: 'User',
            isLocal: true,
        } as any,
    },
    {
        id: '3',
        timestamp: Date.now() - 40000,
        message: 'Great question! We offer a variety of AI-powered voice assistance services. What specific area are you interested in?',
        from: {
            identity: 'agent',
            name: 'AI Assistant',
            isLocal: false,
        } as any,
    },
    {
        id: '4',
        timestamp: Date.now() - 30000,
        message: 'I\'m interested in voice recognition and transcription features.',
        from: {
            identity: 'user',
            name: 'User',
            isLocal: true,
        } as any,
    },
    {
        id: '5',
        timestamp: Date.now() - 20000,
        message: '[TRANSCRIPTION] Can you also tell me about real-time speech processing?',
        from: {
            identity: 'user',
            name: 'User',
            isLocal: true,
        } as any,
    },
    {
        id: '6',
        timestamp: Date.now() - 10000,
        message: 'Absolutely! Our real-time speech processing uses advanced machine learning models to transcribe and understand speech with high accuracy. It supports multiple languages and can handle various accents. The system processes audio in near real-time with minimal latency.',
        from: {
            identity: 'agent',
            name: 'AI Assistant',
            isLocal: false,
        } as any,
    },
    {
        id: '7',
        timestamp: Date.now() - 5000,
        message: '[TRANSCRIPTION] That sounds amazing! What about pricing?',
        from: {
            identity: 'user',
            name: 'User',
            isLocal: true,
        } as any,
    },
    {
        id: '8',
        timestamp: Date.now() - 2000,
        message: 'We offer flexible pricing plans to suit different needs. You can choose from pay-as-you-go options or monthly subscriptions. Would you like me to send you detailed pricing information?',
        from: {
            identity: 'agent',
            name: 'AI Assistant',
            isLocal: false,
        } as any,
    },
    {
        id: '9',
        timestamp: Date.now() - 1000,
        message: 'Yes please!',
        from: {
            identity: 'user',
            name: 'User',
            isLocal: true,
        } as any,
    },
];

export default function TestChatPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 text-2xl font-bold">Chat UI Preview</h1>

                <div className="rounded-lg border border-border bg-card p-4">
                    <h2 className="mb-4 text-lg font-semibold">Message Styling:</h2>
                    <ul className="mb-4 space-y-2 text-sm">
                        <li>
                            <span className="inline-block rounded bg-blue-100 dark:bg-blue-900 px-2 py-1 text-sm">
                                User messages
                            </span>
                            {' '}- Blue background, smaller text (includes text and transcribed audio)
                        </li>
                        <li>
                            <span className="inline-block rounded bg-gray-200 dark:bg-gray-700 px-2 py-1 text-base">
                                AI Agent messages
                            </span>
                            {' '}- Gray background, normal text size
                        </li>
                    </ul>

                    <div className="space-y-4 rounded-md border border-border bg-background p-4">
                        {mockMessages.map((message) => (
                            <ChatEntry
                                key={message.id}
                                entry={message}
                                hideName={false}
                                hideTimestamp={false}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-6 rounded-lg border border-border bg-muted p-4">
                    <h3 className="mb-2 text-sm font-semibold">Note:</h3>
                    <p className="text-sm text-muted-foreground">
                        All messages are now left-aligned. User messages (including transcriptions marked with [TRANSCRIPTION])
                        have a blue background with smaller text, while AI agent responses have a gray background with normal text size.
                    </p>
                </div>
            </div>
        </div>
    );
}

