export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emotion } = req.body;
    const systemPrompt = `You are a magical, comforting spirit created by a guy to comfort his best friend, Rakshi. Rakshi is currently feeling: ${emotion}. Write ONE short, incredibly comforting, beautiful sentence for her. Do not use emojis. Do not sound like a robot. Sound warm, poetic, and fiercely supportive.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // <-- THIS IS THE NEW FIXED MODEL NAME
                messages: [{ role: "system", content: systemPrompt }],
                max_tokens: 60,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("GROQ API REJECTED REQUEST:", data);
            return res.status(500).json({ message: "The magic is resting right now, but your best friend is always here." });
        }

        const aiMessage = data.choices[0].message.content.replace(/"/g, '');
        res.status(200).json({ message: aiMessage });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "The magic is resting right now, but your best friend is always here." });
    }
}
