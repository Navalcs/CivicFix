
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Internal: single attempt to call the Groq API */
async function callGroqOnce(prompt: string): Promise<string> {
    let response: Response;
    try {
        response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a civic complaint assistant for a municipal reporting system.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.4,
                max_tokens: 256,
            }),
        });
    } catch (_networkErr: any) {
        throw new Error('Network error – check your internet connection.');
    }

    const bodyText = await response.text();

    if (!response.ok) {
        if (response.status === 429) {
            const err: any = new Error('rate_limit');
            err.isRateLimit = true;
            throw err;
        }

        try {
            const errJson = JSON.parse(bodyText);
            throw new Error(errJson?.error?.message ?? `HTTP ${response.status}`);
        } catch (inner: any) {
            if (inner.message !== bodyText) throw inner;
            throw new Error(`Groq API error (${response.status}).`);
        }
    }

    const data = JSON.parse(bodyText);
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('No description was generated. Please try again.');
    return text;
}

/**
 * Converts short civic issue text into a professional municipal complaint
 * description using Groq AI. Automatically retries up to 3 times on rate
 * limit (429) with increasing delays (5s → 10s → 20s).
 */
export async function generateDescription(userText: string): Promise<string> {
    if (!userText.trim()) {
        throw new Error('Please enter some text first.');
    }

    const prompt = `Convert the following short input into a professional, formal complaint description for a government report.

Rules:
- Output ONLY the complaint description text. No intro, labels, or commentary.
- Keep it concise (2–4 sentences).
- Use formal, polite municipal language.
- Mention the issue, its impact, and request for prompt action.

Citizen input: "${userText}"`;

    const delays = [5000, 10000, 20000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
            return await callGroqOnce(prompt);
        } catch (err: any) {
            const isLast = attempt === delays.length;
            if (err?.isRateLimit && !isLast) {
                const wait = delays[attempt];
                await sleep(wait);
                continue;
            }
            if (err?.isRateLimit) {
                throw new Error('Rate limit exceeded. Please wait a minute and try again.');
            }
            throw err;
        }
    }

    throw new Error('Failed to generate description after retries.');
}
