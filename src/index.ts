import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateResponse(prompt: string): Promise<string> {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(
        /(```[\s\S]*?```|`[^`]+`)/g,
        "<pre><code>$1</code></pre>"
    );
    return text;
}
