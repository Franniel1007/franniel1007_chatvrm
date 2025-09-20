import React, { useState, useEffect } from 'react';
import { TextButton } from './textButton';
import Cookies from 'js-cookie';
import { websocketService } from '../services/websocketService';
import { refreshAccessToken } from '../utils/auth';
import { tokenRefreshService } from '../services/tokenRefreshService';
import { Link } from './link';

interface RestreamTokens {
    access_token: string;
    refresh_token: string;
}

export interface ChatMessage {
    username: string; // Twitch username
    displayName: string; // Display name (may include emojis)
    timestamp: number;
    text: string;
    emotes?: { [key: string]: string }; // Emote positions -> URL
    badges?: string[]; // Optional badges/emblems
}

type Props = {
    onTokensUpdate: (tokens: any) => void;
    onChatMessage: (message: ChatMessage) => void;
};

export const RestreamTokens: React.FC<Props> = ({ onTokensUpdate, onChatMessage }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [rawMessages, setRawMessages] = useState<any[]>([]);

    // Load saved tokens
    useEffect(() => {
        const savedTokens = Cookies.get('restream_tokens');
        if (savedTokens) {
            try {
                const tokens = JSON.parse(savedTokens);
                setJsonInput(JSON.stringify(tokens, null, 2));
            } catch (err) {
                console.error('Error parsing saved tokens:', err);
            }
        }
    }, []);

    const handleJsonPaste = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        setJsonInput(newValue);
        setError(null);

        try {
            const tokens: RestreamTokens = JSON.parse(newValue);

            if (!tokens.access_token || !tokens.refresh_token) {
                setError('Invalid token format');
                return;
            }

            const formattedJson = JSON.stringify(tokens, null, 2);
            Cookies.set('restream_tokens', formattedJson, { expires: 30 });
            onTokensUpdate(tokens);

            setError(null);
            setJsonInput(formattedJson);
        } catch (err) {
            setError('Invalid JSON format. Please check your input.');
        }
    };

    const handleClearTokens = () => {
        tokenRefreshService.stopAutoRefresh();
        Cookies.remove('restream_tokens');
        onTokensUpdate(null);
        setJsonInput('');
        setError(null);
    };

    useEffect(() => {
        const handleConnectionChange = (connected: boolean) => {
            setIsConnected(connected);
            setError(null);
        };

        const handleRawMessage = (msg: any) => {
            setRawMessages(prev => [...prev, msg]);
        };

        const handleChatMessage = (msg: any) => {
            // Map Restream message to ChatMessage
            const chatMsg: ChatMessage = {
                username: msg.payload?.eventPayload?.author?.username || 'Unknown',
                displayName: msg.payload?.eventPayload?.author?.displayName || 'Unknown',
                timestamp: msg.payload?.eventPayload?.timestamp || Math.floor(Date.now() / 1000),
                text: msg.payload?.eventPayload?.text || '',
                emotes: msg.payload?.eventPayload?.emotes,
                badges: msg.payload?.eventPayload?.badges,
            };

            // Emit to parent
            onChatMessage(chatMsg);
        };

        const handleTokenRefresh = (newTokens: RestreamTokens) => {
            const formattedJson = JSON.stringify(newTokens, null, 2);
            setJsonInput(formattedJson);
            setError(null);

            websocketService.off('rawMessage', handleRawMessage);
            websocketService.off('chatMessage', handleChatMessage);
            websocketService.on('rawMessage', handleRawMessage);
            websocketService.on('chatMessage', handleChatMessage);
        };

        websocketService.on('connectionChange', handleConnectionChange);
        websocketService.on('rawMessage', handleRawMessage);
        websocketService.on('chatMessage', handleChatMessage);
        tokenRefreshService.on('tokensRefreshed', handleTokenRefresh);

        setIsConnected(websocketService.isConnected());

        return () => {
            websocketService.off('connectionChange', handleConnectionChange);
            websocketService.off('rawMessage', handleRawMessage);
            websocketService.off('chatMessage', handleChatMessage);
            tokenRefreshService.off('tokensRefreshed', handleTokenRefresh);
        };
    }, [onChatMessage]);

    const connectWebSocket = () => {
        try {
            const tokens: RestreamTokens = JSON.parse(jsonInput);

            if (!tokens.access_token) {
                setError('No access token available');
                return;
            }

            websocketService.connect(tokens.access_token);
            tokenRefreshService.startAutoRefresh(tokens, onTokensUpdate);
        } catch (err) {
            setError('Invalid JSON format or connection error');
        }
    };

    const disconnectWebSocket = () => {
        websocketService.disconnect();
        tokenRefreshService.stopAutoRefresh();
    };

    return (
        <div className="my-40">
            <div className="my-16 typography-20 font-bold">Restream Integration</div>
            <div className="my-16">
                Get your Restream authentication tokens JSON from the <Link
                    url="https://restream-token-fetcher.vercel.app/"
                    label="Restream Token Fetcher"
                />.
            </div>

            <textarea
                value={jsonInput}
                onChange={handleJsonPaste}
                placeholder='{"access_token": "...", "refresh_token": "..."}'
                className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-[120px] rounded-8 w-full font-mono text-sm"
            />
            {error && <div className="text-red-500 my-8">{error}</div>}

            <div className="flex gap-4 my-16">
                <TextButton onClick={isConnected ? disconnectWebSocket : connectWebSocket}>
                    {isConnected ? 'Stop Listening' : 'Start Listening'}
                </TextButton>
                <TextButton onClick={handleClearTokens}>Clear Tokens</TextButton>
            </div>

            <div className={`my-8 p-8 rounded-4 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Status: {isConnected ? 'Connected' : 'Disconnected'}
            </div>

            {rawMessages.length > 0 && (
                <div className="my-16">
                    <div className="typography-16 font-bold mb-8">Raw Messages:</div>
                    <div className="bg-surface1 p-16 rounded-8 max-h-[400px] overflow-y-auto">
                        {rawMessages.map((msg, idx) => (
                            <div key={idx} className="font-mono text-sm mb-8">
                                {JSON.stringify(msg, null, 2)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
