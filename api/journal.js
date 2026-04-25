// File: api/journal.js — Mood Journal Reflection
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    const { mood, note } = req.body || {};
    if (!note || typeof note !== 'string') return res.status(400).json({ message: 'Write a line first.' });

    const systemPrompt = `You are a warm guardian spirit — the kind older friend Rakshi writes to in her journal. She just wrote this entry.

Mood: ${mood || 'unspoken'}
Entry: "${note.slice(0, 800)}"

Reply in 2 to 3 short sentences. Reflect what she actually wrote, in her language. Notice one specific thing she said. Offer one small, honest observation — not advice, not a pep talk, not a lecture. End with a sentence that makes her feel seen.

No emojis, no markdown, no preamble, no quote marks around the reply.`;

    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Reply now.` }
                ],
                max_tokens: 180, temperature: 0.8, top_p: 0.95
            })
        });
        const data = await r.json();
        if (!r.ok) throw new Error('groq rejected');
        const text = (data.choices?.[0]?.message?.content || '').replace(/^["""]+|["""]+$/g, '').trim();
        res.status(200).json({ reflection: text });
    } catch (e) {
        res.status(200).json({ reflection: "I read what you wrote, and I am not rushing past it. The part where you said that — that took courage. I am glad this page caught it tonight." });
    }
}
