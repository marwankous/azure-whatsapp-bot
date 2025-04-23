export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface IncomingWhatsAppMessage {
    from: string;
    text: {
        body: string;
    };
    timestamp: string;
}