export interface Config {
    azure: {
        endpoint: string;
        apiKey: string;
        deployment: string;
        apiVersion: string;
        assistantId: string;
        faqPath: string;
    };
    whatsapp: {
        apiKey: string;
        phoneNumberId: string;
        webhookVerifyToken: string;
    };
    server: {
        port: number;
    };
}

const config: Config = {
    azure: {
        endpoint: 'https://tia.openai.azure.com/',
        apiKey: '9fMzIsTmgdmrJopDd21c916F5mABSJr830s00qvcz35c8p41hIqvJQQJ99BDAC5T7U2XJ3w3AAABACOGgJu1',
        deployment: 'gpt-4',
        apiVersion: '2025-01-01-preview',
        assistantId: 'asst_jsor51L1vCQCayWAKyALdDyV',
        faqPath: "./src/data/faq.json"
    },
    whatsapp: {
        apiKey: 'EAAOU4puaqSMBOySSEXM9bJxAZASA0BAGAcMZAM2AI9ZCaAYg927zmQ3wl6san9ZBChU7XZBT6FDlndhrehtNVC7eljDVbW5H8WAnXHkdDZBF1939ZCxzFd0OskGGZBGIHwQSum8stlWLMTTzu79rAbLrd5TgkQnBz1U5ZBHqP0a9iu1c37J3oZANFwUiCWsX6VW4YOycxqPaZClB2T9ZCxjsHxpfQYTZCcIg5',
        phoneNumberId: '642144758978578',
        webhookVerifyToken: 'my-super-secret-token-123',
    },
    server: {
        port: 4006
    }
};

export default config;