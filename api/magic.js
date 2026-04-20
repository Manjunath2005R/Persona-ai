// File: api/magic.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emotion } = req.body;

    // THE PROMPT: This tells the AI how to act.
    const systemPrompt = `
    You are a magical, comforting spirit created by a guy to comfort his best friend, Rakshi.
    Rakshi is currently feeling: ${emotion}.
    Write ONE short, incredibly comforting, beautiful sentence for her. 
    Do not use emojis. Do not sound like a robot. Sound warm, poetic, and fiercely supportive.
    `;

    try {
        // We use Groq because it is free, blazing fast, and runs Llama models perfectly.
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // A fast, smart small model
                messages: [{ role: "system", content: systemPrompt }],
                max_tokens: 60,
                temperature: 0.7
            })
        });

        const data = await response.json();
        const aiMessage = data.choices[0].message.content.replace(/"/g, ''); // Clean up quotes

        res.status(200).json({ message: aiMessage });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "The magic is resting right now, but your best friend is always here." });
    }
}