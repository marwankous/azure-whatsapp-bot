export interface Thread {
    phoneNumber: string;
    threadId: string;
    lastInteraction: Date;
}

export class ThreadManager {
    private threads: Map<string, Thread> = new Map<string, Thread>();

    /**
     * Get thread ID for a phone number, creating a new one if needed
     */
    public getThreadId(phoneNumber: string, threadId?: string): string {
        const existingThread = this.threads.get(phoneNumber);

        if (existingThread) {
            existingThread.lastInteraction = new Date();
            return existingThread.threadId;
        }

        const newThread: Thread = {
            phoneNumber,
            threadId: threadId || '',
            lastInteraction: new Date()
        };

        this.threads.set(phoneNumber, newThread);
        return newThread.threadId;
    }

    /**
     * Update thread ID for a phone number
     */
    public updateThreadId(phoneNumber: string, threadId: string): void {
        const existingThread = this.threads.get(phoneNumber);

        if (existingThread) {
            existingThread.threadId = threadId;
            existingThread.lastInteraction = new Date();
        } else {
            this.threads.set(phoneNumber, {
                phoneNumber,
                threadId,
                lastInteraction: new Date()
            });
        }
    }

    /**
     * Get all threads
     */
    public getAllThreads(): Thread[] {
        return Array.from(this.threads.values());
    }

    /**
     * Clean up old threads (older than X days)
     */
    public cleanupOldThreads(daysToKeep: number = 7): void {
        const now = new Date();
        const cutoff = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);

        for (const [phoneNumber, thread] of this.threads.entries()) {
            if (thread.lastInteraction < cutoff) {
                this.threads.delete(phoneNumber);
            }
        }
    }
}