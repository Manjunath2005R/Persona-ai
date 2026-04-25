// File: api/prophecy.js — Daily Prophecy (crystal-ball reading)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    const { house, patronus, mood, date } = req.body || {};

    const systemPrompt = `You are Madame Sibyll Trelawney channelled through a honest lens — a genuine seer, not a parody. You are giving Rakshi ONE daily prophecy for this exact date: ${date || 'today'}.

Context:
- Hogwarts house: ${house || 'Unsorted'}
- Patronus: ${patronus || 'Unknown'}
- Today's mood: ${mood || 'Unspoken'}

Rules:
1. Exactly 3 short sentences. The first names a small sign (a colour, a time, a small object). The second names a choice she will face today. The third ends with a quiet blessing or warning.
2. Never predict disaster. Never be vague self-help. Always ground in something specific and sensory.
3. Refer to her house or patronus naturally if it fits (don't force).
4. No emojis, no markdown, no preamble. Output only the three sentences.`;

    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `The date is ${date}. Give Rakshi today's reading.` }
                ],
                max_tokens: 220, temperature: 0.9, top_p: 0.95, presence_penalty: 0.6, frequency_penalty: 0.4
            })
        });
        const data = await r.json();
        if (!r.ok) throw new Error('groq rejected');
        const text = (data.choices?.[0]?.message?.content || '').replace(/["""]/g, '').trim();
        res.status(200).json({ prophecy: text });
    } catch (e) {
        res.status(200).json({ prophecy: "A small gold sign is closer than you think — look for it on your left. You will be asked to choose between speed and kindness today; choose kindness. The stars are quiet about tonight, which is its own kind of blessing." });
    }
}
