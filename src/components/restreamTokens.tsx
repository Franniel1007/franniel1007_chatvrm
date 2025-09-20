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

// Add new interface for chat messages
interface ChatMessage {
    username: string;
    displayName: string;
    timestamp: number;
    text: string;
    isSystemMessage?: boolean; // Para identificar mensajes del sistema
}

type Props = {
    onTokensUpdate: (tokens: any) => void;
    onChatMessage: (message: ChatMessage) => void;
};

export const RestreamTokens: React.FC<Props> = ({ onTokensUpdate, onChatMessage }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load saved tokens on component mount
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
        const handleConnectionChange = (isConnected: boolean) => {
            setIsConnected(isConnected);
            setError(null);
        };

        const handleChatMessage = (message: ChatMessage) => {
            setMessages(prev => [...prev, message]);
            onChatMessage(message);
        };

        const handleTokenRefresh = (newTokens: RestreamTokens) => {
            const formattedJson = JSON.stringify(newTokens, null, 2);
            setJsonInput(formattedJson);
            setError(null);
            websocketService.off('chatMessage', handleChatMessage);
            websocketService.on('chatMessage', handleChatMessage);
        };

        websocketService.on('connectionChange', handleConnectionChange);
        websocketService.on('chatMessage', handleChatMessage);
        tokenRefreshService.on('tokensRefreshed', handleTokenRefresh);

        setIsConnected(websocketService.isConnected());

        return () => {
            websocketService.off('connectionChange', handleConnectionChange);
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

    // Simular un mensaje de sistema y guardarlo en el historial
    const sendTestSystemMessage = () => {
        const testMessage: ChatMessage = {
            username: 'System',
            displayName: 'System',
            timestamp: Math.floor(Date.now() / 1000),
            text: 'Received these messages from your livestream, please respond: Sery Bot: Sery Bot is here seryboArrive FrannielMedina: Hola que tal?',
            isSystemMessage: true,
        };
        onChatMessage(testMessage);
        setMessages(prev => [...prev, testMessage]);
    };

    const handleRefreshTokens = async () => {
        try {
            const currentTokens: RestreamTokens = JSON.parse(jsonInput);
            setIsRefreshing(true);
            setError(null);

            const newTokens = await refreshAccessToken(currentTokens.refresh_token);
            const formattedJson = JSON.stringify(newTokens, null, 2);

            Cookies.set('restream_tokens', formattedJson, { expires: 30 });
            onTokensUpdate(newTokens);
            setJsonInput(formattedJson);
        } catch (err) {
            setError('Failed to refresh tokens. Please check your refresh token.');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="my-40">
            <div className="my-16 typography-20 font-bold">Integración con Restream</div>
            <div className="my-16">
                Obtén tu JSON de tokens de autenticación de Restream desde el{' '}
                <Link
                    url="https://restream-token-fetcher.vercel.app/"
                    label="Restream Token Fetcher"
                />. Esto permite a ChatVRM escuchar tus mensajes de chat desde Restream (actualmente compatible con fuentes de Twitch y X). Cuando pegues tus tokens JSON y hagas clic en "Empezar a Escuchar", ChatVRM escuchará tus mensajes y actualizará periódicamente tus tokens.
            </div>
            <div className="my-16">
                Pega aquí tu JSON de tokens de autenticación de Restream:
            </div>
            <textarea
                value={jsonInput}
                onChange={handleJsonPaste}
                placeholder='{"access_token": "...", "refresh_token": "..."}'
                className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-[120px] rounded-8 w-full font-mono text-sm"
            />
            {error && (
                <div className="text-red-500 my-8">{error}</div>
            )}
            <div className="flex gap-4 my-16">
                <div className="pr-8">
                    <TextButton
                        onClick={isConnected ? disconnectWebSocket : connectWebSocket}
                    >
                        {isConnected ? 'Detener Escucha' : 'Empezar a Escuchar'}
                    </TextButton>
                </div>
                <div className="pr-8">
                    <TextButton onClick={handleClearTokens}>Limpiar Tokens</TextButton>
                </div>
                <div className="pr-8">
                    <TextButton
                        onClick={handleRefreshTokens}
                        disabled={isRefreshing || !jsonInput}
                    >
                        {isRefreshing ? 'Actualizando...' : 'Actualizar Tokens'}
                    </TextButton>
                </div>
                {isConnected && (
                    <div>
                        <TextButton onClick={sendTestSystemMessage}>Enviar Mensaje de Prueba del Sistema</TextButton>
                    </div>
                )}
            </div>
            {/* Connection Status */}
            <div className={`my-8 p-8 rounded-4 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Estado: {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
            {/* Filtered Chat Messages */}
            {messages.length > 0 && (
                <div className="my-16">
                    <div className="typography-16 font-bold mb-8">Mensajes de Chat Filtrados:</div>
                    <div className="bg-surface1 p-16 rounded-8 max-h-[400px] overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className="font-mono text-sm mb-8">
                                [{new Date(msg.timestamp * 1000).toLocaleTimeString()}]
                                <strong>{msg.isSystemMessage ? msg.displayName : msg.displayName}</strong>: {msg.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="text-sm text-gray-600">
                Tus tokens de Restream se almacenarán de forma segura en las cookies del navegador y se restaurarán cuando regreses.
            </div>
        </div>
    );
};
