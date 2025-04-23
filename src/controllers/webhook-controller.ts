import { Request, Response } from 'express';
import { AzureService } from '../services/azure-service';
import { WhatsAppService } from '../services/whatsapp-service';
import { logger } from '../utils/logger';

export class WebhookController {
    private whatsAppService: WhatsAppService;
    private azureService: AzureService;

    constructor(whatsAppService: WhatsAppService, azureService: AzureService) {
        this.whatsAppService = whatsAppService;
        this.azureService = azureService;
    }

    /**
     * Verify webhook endpoint
     */
    public verifyWebhook = (req: Request, res: Response): void => {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;

        if (this.whatsAppService.verifyWebhook(mode, token)) {
            logger.info('Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            logger.error('Webhook verification failed');
            res.sendStatus(403);
        }
    };

    /**
     * Handle incoming webhook messages
     */
    public handleWebhook = async (req: Request, res: Response): Promise<void> => {
        // Always respond to Webhook immediately
        res.status(200).send('EVENT_RECEIVED');

        try {
            const messages = this.whatsAppService.parseWebhookMessages(req.body);

            for (const { from, message } of messages) {
                logger.info(`Received message from ${from}: ${message}`);

                // Process message asynchronously
                this.processMessage(from, message).catch((error: any) => {
                    logger.error(`Error processing message from ${from}:`, error);
                });
            }
        } catch (error) {
            logger.error('Error in webhook handler:', error);
        }
    };

    /**
     * Process an individual message
     */
    private processMessage = async (from: string, message: string): Promise<void> => {
        try {
            // Get response from Azure Assistant
            const response = await this.azureService.getResponse(from, message);

            // Send response back to WhatsApp
            await this.whatsAppService.sendMessage(from, response);
        } catch (error) {
            logger.error(`Error processing message from ${from}:`, error);

            // Send error message to user
            await this.whatsAppService.sendMessage(
                from,
                "I'm sorry, I encountered an error while processing your message."
            );
        }
    };
}