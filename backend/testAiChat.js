require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
    try {
        const apiKey = process.env.GEMINI_API_KEY || 'dummy-key';
        console.log("Using API Key:", apiKey.substring(0, 5) + "...");
        const ai = new GoogleGenAI({ apiKey });
        
        const result = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: 'Hello, reply with OK'
        });
        console.log("AI Response:", result.text);
        process.exit(0);
    } catch (e) {
        console.error("AI Error:", e.message);
        process.exit(1);
    }
}
test();
