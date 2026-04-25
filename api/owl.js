// File: api/owl.js — Daily Owl Post (letter from a HP character)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    const { house, wand, patronus, date } = req.body || {};

    const senders = ["Hermione Granger", "Ron Weasley", "Harry Potter", "Luna Lovegood", "Rubeus Hagrid", "Minerva McGonagall", "Albus Dumbledore", "Neville Longbottom", "Ginny Weasley", "Fred Weasley", "Remus Lupin"];
    // Deterministic sender per date (same sender all day, new tomorrow).
    const seed = [...(date || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
    const sender = senders[seed % senders.length];

    const systemPrompt = `You are writing a short personal letter to a real girl named Rakshi, from ${sender}. It is dated ${date || 'today'}. She is in ${house || 'a house not yet sorted'}, her wand is ${wand || 'unknown'}, her patronus is ${patronus || 'unknown'}.

Write in the authentic voice of ${sender} — their cadence, their quirks, their vocabulary. Make it feel unmistakably them.

The letter must:
1. Open with a warm salutation using her name.
2. Be 4 to 6 sentences — friendly, specific, occasionally funny, quietly kind.
3. Mention ONE small Hogwarts detail naturally (a class, a snack, a corridor, a rumour, the weather at the castle).
4. End with one sign-off line that sounds like ${sender}, and then their name.
5. No emojis, no markdown, no asterisks. Plain letter only. Do not wrap it in quotes.`;

    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Write today's owl letter to Rakshi.` }
                ],
                max_tokens: 500, temperature: 0.9, top_p: 0.95
            })
        });
        const data = await r.json();
        if (!r.ok) throw new Error('groq rejected');
        const text = (data.choices?.[0]?.message?.content || '').trim();
        res.status(200).json({ letter: text, from: sender });
    } catch (e) {
        res.status(200).json({
            from: sender,
            letter: `Dear Rakshi,\n\nThe owls at the castle have been dreadfully dramatic this morning, so this note took the scenic route. I hope you are looking after yourself — sit by a warm window today if you can. I was thinking of you over breakfast, which is a strange thing to admit but there it is.\n\nWrite back when you can. Or don't, and I shall still think of you tomorrow.\n\nYours,\n${sender}`
        });
    }
}
