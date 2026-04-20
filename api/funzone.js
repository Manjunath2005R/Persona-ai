// File: api/funzone.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { friendName } = req.body;
    
    const systemPrompt = `You are a hilarious, highly imaginative storyteller. A girl named Rakshi wants to hear a completely fake, absurd, and funny story about her friend named ${friendName}. 
    
    Randomly pick ONE of these themes for the story: Love, marriage, trip, home activity, fight, silly horror, thriller, or drama. 
    
    Rules:
    1. Make it incredibly ridiculous, lighthearted, and guaranteed to make Rakshi smile or laugh.
    2. Keep it short (2 to 3 sentences maximum).
    3. Do NOT use emojis.
    4. Do not act like an AI, just tell the story directly.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: systemPrompt }],
                max_tokens: 150,
                temperature: 0.9 // High temperature means it will NEVER repeat the same story!
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("GROQ API REJECTED REQUEST:", data);
            throw new Error("Groq API failed");
        }

        const aiMessage = data.choices[0].message.content.replace(/"/g, '');
        res.status(200).json({ message: aiMessage });

    } catch (error) {
        console.error("Fun Zone API Error:", error);
        res.status(500).json({ message: `The joke machine is resting, but just imagine ${friendName} tripping over a banana peel while trying to look cool.` });
    }
}
