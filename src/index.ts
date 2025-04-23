import express from 'express';
import config from './config/config';
import { WebhookController } from './controllers/webhook-controller';
import { ThreadManager } from './models/thread';
import { AzureService } from './services/azure-service';
import { WhatsAppService } from './services/whatsapp-service';
import { logger } from './utils/logger';

// Initialize the application
const app = express();
app.use(express.json());

// Initialize services
const threadManager = new ThreadManager();
const whatsAppService = new WhatsAppService();
const azureService = new AzureService(threadManager);

// Initialize controller
const webhookController = new WebhookController(whatsAppService, azureService);

// Set up routes
app.get('/webhook', webhookController.verifyWebhook);
app.post('/webhook', webhookController.handleWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Setup thread cleanup job
setInterval(() => {
    logger.info('Running thread cleanup job');
    threadManager.cleanupOldThreads(7); // Clean threads older than 7 days
}, 24 * 60 * 60 * 1000); // Run daily

// Start the server
app.listen(config.server.port, "0.0.0.0", () => {
    logger.info(`Server is running on port ${config.server.port}`);
});