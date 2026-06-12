import type { ChatMessage } from "@/types/predai";

export async function generateResponse(messages: ChatMessage[]) {
    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b:free",
                stream: true,
                messages,
            }),
        },
    );

    if (!response.ok) {
        throw new Error("OpenRouter request failed");
    }

    return response.json();
}
