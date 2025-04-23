import axios from 'axios';
import config from '../config/config';
import { logger } from '../utils/logger';

export class WhatsAppService {
    private apiUrl = 'https://graph.facebook.com/v18.0';

    /**
     * Send a message via WhatsApp API
     */
    public async sendMessage(to: string, message: string): Promise<boolean> {
        try {
            const response = await axios.post(
                `${this.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to,
                    type: 'text',
                    text: {
                        body: message
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.whatsapp.apiKey}`
                    }
                }
            );

            logger.info(`Message sent to ${to}`);
            return true;
        } catch (error) {
            logger.error('Error sending WhatsApp message:', error);
            return false;
        }
    }

    /**
     * Verify webhook
     */
    public verifyWebhook(mode: string, token: string): boolean {
        return mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken;
    }

    /**
     * Format incoming messages
     */
    public parseWebhookMessages(body: any): Array<{ from: string; message: string }> {
        const messages: Array<{ from: string; message: string }> = [];

        try {
            if (!body.entry || !body.entry.length) {
                return messages;
            }

            for (const entry of body.entry) {
                if (!entry.changes || !entry.changes.length) continue;

                for (const change of entry.changes) {
                    if (change.field !== 'messages') continue;

                    const value = change.value;
                    if (!value || !value.messages || !value.messages.length) continue;

                    for (const msg of value.messages) {
                        if (msg.type !== 'text' || !msg.text || !msg.text.body) continue;

                        messages.push({
                            from: msg.from,
                            message: msg.text.body
                        });
                    }
                }
            }
        } catch (error) {
            logger.error('Error parsing webhook messages:', error);
        }

        return messages;
    }
}