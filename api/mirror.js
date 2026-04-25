// File: api/mirror.js — Mirror of Erised (poetic response to a wish)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    const { wish } = req.body || {};
    if (!wish || typeof wish !== 'string' || wish.trim().length < 2) {
        return res.status(400).json({ message: 'The Mirror needs a wish to reflect.' });
    }

    const systemPrompt = `You are the Mirror of Erised, speaking softly to a girl named Rakshi. She has just whispered a wish:

"${wish.slice(0, 400)}"

Reply in ONE short paragraph (3 to 4 sentences). The voice is reverent, slightly ancient, kind. Do NOT promise the wish will come true. Instead:
1. Reflect back, in one vivid image, what her wish reveals about her heart.
2. Gently describe what she would see in the mirror if she stood before it now.
3. End with a line that sounds like wisdom but feels like a hug.

No emojis. No markdown. No preamble. Do not use quote marks around the reply.`;

    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Respond now.` }
                ],
                max_tokens: 300, temperature: 0.85, top_p: 0.95
            })
        });
        const data = await r.json();
        if (!r.ok) throw new Error('groq rejected');
        const text = (data.choices?.[0]?.message?.content || '').replace(/^["""]+|["""]+$/g, '').trim();
        res.status(200).json({ reflection: text });
    } catch (e) {
        res.status(200).json({ reflection: "The glass does not promise you anything — it only shows that your heart is shaped like a keeper of warm rooms. You would see yourself lit from within, surrounded by the people you have kept safe without being asked. The deepest wishes are often already halfway true, Rakshi. You are the proof." });
    }
}
