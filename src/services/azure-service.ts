
import * as fs from 'fs';
import { AzureOpenAI } from "openai";
import * as path from 'path';
import config from '../config/config';
import { ThreadManager } from '../models/thread';
import { logger } from '../utils/logger';

export class AzureService {
    private client: AzureOpenAI;
    private threadManager: ThreadManager;
    private faqData: any;

    constructor(threadManager: ThreadManager) {
        this.client = new AzureOpenAI({
            endpoint: config.azure.endpoint,
            apiKey: config.azure.apiKey,
            apiVersion: config.azure.apiVersion,
        });
        this.threadManager = threadManager;
        this.loadFAQData();
    }

    /**
     * Load FAQ data from file
     */
    private loadFAQData(): void {
        try {
            const faqPath = path.resolve(config.azure.faqPath);
            const rawData = fs.readFileSync(faqPath, 'utf8');
            this.faqData = JSON.parse(rawData);
            logger.info('FAQ data loaded successfully');
        } catch (error) {
            logger.error('Failed to load FAQ data:', error);
            this.faqData = { questions: [] };
        }
    }

    /**
     * Create a new thread in Azure Assistant
     */
    public async createThread(phoneNumber: string): Promise<string> {
        try {
            const thread = await this.client.beta.threads.create();
            const threadId = thread.id;

            this.threadManager.updateThreadId(phoneNumber, threadId);
            logger.info(`Created new thread ${threadId} for phone number ${phoneNumber}`);

            return threadId;
        } catch (error) {
            logger.error('Error creating thread:', error);
            throw error;
        }
    }

    /**
     * Check if message can be answered from FAQ
     */
    private findFAQAnswer(message: string): string | null {
        if (!this.faqData || !this.faqData.questions) return null;

        const normalizedMessage = message.toLowerCase().trim();

        for (const item of this.faqData.questions) {
            const question = item.question.toLowerCase().trim();

            // Simple matching - you might want to use a more sophisticated approach
            if (normalizedMessage.includes(question) ||
                question.includes(normalizedMessage) ||
                this.calculateSimilarity(normalizedMessage, question) > 0.7) {
                return item.answer;
            }
        }

        return null;
    }

    /**
     * Calculate text similarity (simple implementation)
     */
    private calculateSimilarity(text1: string, text2: string): number {
        // Simple word overlap similarity - could be improved
        const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));

        if (words1.size === 0 || words2.size === 0) return 0;

        let overlap = 0;
        for (const word of words1) {
            if (words2.has(word)) overlap++;
        }

        return overlap / Math.max(words1.size, words2.size);
    }

    /**
     * Get response from Azure Assistant
     */
    public async getResponse(phoneNumber: string, userMessage: string): Promise<string> {
        try {
            // First check if the message can be answered from FAQ
            const faqAnswer = this.findFAQAnswer(userMessage);
            if (faqAnswer) {
                logger.info(`Found FAQ answer for: ${userMessage}`);
                return faqAnswer;
            }

            // Get or create thread ID
            let threadId = this.threadManager.getThreadId(phoneNumber);
            if (!threadId) {
                threadId = await this.createThread(phoneNumber);
            }

            // Add message to thread
            await this.client.beta.threads.messages.create(threadId, {
                role: "user",
                content: userMessage
            });

            // Run the assistant on the thread
            const run = await this.client.beta.threads.runs.create(threadId, {
                assistant_id: config.azure.assistantId
            });

            // Poll for completion (in production, use a webhook instead)
            let runStatus = await this.client.beta.threads.runs.retrieve(threadId, run.id);
            while (runStatus.status !== "completed" && runStatus.status !== "failed") {
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await this.client.beta.threads.runs.retrieve(threadId, run.id);
            }

            if (runStatus.status === "failed") {
                logger.error(`Run failed: ${JSON.stringify(runStatus)}`);
                return "I'm sorry, I wasn't able to process your request.";
            }

            // Get the response messages
            const messages = await this.client.beta.threads.messages.list(threadId);
            const assistantMessages = Array.from(messages.data)
                .filter(msg => msg.role === "assistant")
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            if (assistantMessages.length > 0 && assistantMessages[0].content) {
                const content = assistantMessages[0].content[0];
                if ('text' in content) {
                    return content.text.value;
                }
            }

            return "I'm sorry, I don't have a response for that.";
        } catch (error) {
            logger.error('Error getting response from Azure:', error);
            return "I'm sorry, I encountered an error while processing your request.";
        }
    }
}