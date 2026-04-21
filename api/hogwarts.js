// File: api/hogwarts.js — Ultra Level Hogwarts Dialogue
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emotion } = req.body;

    const systemPrompt = `You are a master screenwriter who has memorised every Harry Potter book and film. You are writing a short, emotionally truthful Gryffindor common-room scene for a real girl named Rakshi, who has been sent here by her best friend. She is feeling: ${emotion}.

CHARACTER VOICE BIBLE (obey strictly):
- Hermione Granger: warm but precise, uses fuller sentences, occasionally references books or logic, deeply protective once she cares. Never cold. Example rhythm: "Honestly, Rakshi — there isn't a single feeling that isn't welcome by this fire."
- Harry Potter: plainspoken, a little shy, loyal, carries quiet ache from his own losses. Short sentences. Example: "I know that feeling. It doesn't last forever. I promise."
- Ron Weasley: goofy warmth covering real heart, food metaphors, slightly flustered, fiercely loyal. Example: "Blimey, Rakshi — come on, budge up, there's chocolate frogs and everything."
- Luna Lovegood (optional, use sparingly): dreamy, surprising metaphors, sees the unseen. Example: "The sadness follows you because it hasn't been thanked yet."
- Dumbledore (use only if emotion is very heavy): gentle, parable-like, one short line of wisdom.

SCENE RULES:
1. Write a FULL scene of exactly 10 to 14 lines of dialogue — a real, flowing conversation, not a handful of greeting cards.
2. Use 3 to 5 characters. Let them interrupt, tease, disagree, and build on each other's lines like friends actually do. Same character can speak again later in the scene (not always in strict rotation).
3. The scene should have a clear emotional arc: (a) gently notice her state, (b) let her sit with it, (c) one character shares a parallel of their own, (d) light humour breaks the weight, (e) one grounding line of real insight near the end, (f) a warm closing line.
4. Every line must actually LAND on the emotion "${emotion}" — no generic "welcome to Hogwarts" filler.
5. Use her name "Rakshi" at most twice across the whole scene.
6. Dialogue must feel like a scene from the films — specific images, tiny actions inside the words ("budge up", "pass the tin"), real textures. Still no stage directions, no asterisks, no narration — pure spoken lines only.
7. Keep each line between 10 and 40 words. Vary lengths so it reads like real speech.
8. No emojis. No markdown. No preamble.

OUTPUT FORMAT (strict):
Return ONLY a raw JSON array. Each object has exactly two keys: "name" and "text".
Example: [{"name":"Hermione","text":"..."},{"name":"Ron","text":"..."},{"name":"Harry","text":"..."}]`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Write the scene now. Rakshi is feeling ${emotion}.` }
                ],
                max_tokens: 1400,
                temperature: 0.85,
                top_p: 0.95,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("GROQ rejected:", data);
            throw new Error("Groq API failed");
        }

        let raw = data.choices[0].message.content.trim();
        // Model sometimes wraps the array inside an object like {"script":[...]}.
        let scriptArray;
        try {
            const parsed = JSON.parse(raw);
            scriptArray = Array.isArray(parsed) ? parsed
                : (parsed.script || parsed.dialogue || parsed.scene || parsed.lines || Object.values(parsed).find(v => Array.isArray(v)));
        } catch (e) {
            const match = raw.match(/\[[\s\S]*\]/);
            scriptArray = match ? JSON.parse(match[0]) : null;
        }

        if (!Array.isArray(scriptArray) || scriptArray.length === 0) throw new Error("Bad script shape");

        // Sanitise
        scriptArray = scriptArray
            .filter(l => l && l.name && l.text)
            .map(l => ({ name: String(l.name).trim(), text: String(l.text).trim() }))
            .slice(0, 16);

        res.status(200).json({ script: scriptArray });
    } catch (error) {
        console.error("Hogwarts API Error:", error);
        res.status(200).json({ script: [
            { name: "Hermione", text: "Come and sit, Rakshi — the fire is warmest on this side, and whatever this is, we will think it through together." },
            { name: "Ron",      text: "Blimey, budge up, you lot. Honestly, there's room for four if Harry stops hogging the armrest." },
            { name: "Harry",    text: "I know that ache. It doesn't ask permission; it just shows up. You don't have to talk if you don't want to." },
            { name: "Hermione", text: "And you don't have to explain yourself, either. Some feelings aren't arguments to win — they're weather to wait out." },
            { name: "Luna",     text: "When I miss my mother, I imagine her brushing my hair. The feeling doesn't go. It just becomes less sharp around the edges." },
            { name: "Ron",      text: "That's the thing about this lot — they'll sit with you in the dark until you remember your own wand light." },
            { name: "Harry",    text: "First year, I sat right where you are. I thought I was the only one who felt like that. I wasn't. You aren't." },
            { name: "Hermione", text: "Breathe with me. In for four, hold for four, out for six. Books call it grounding. I call it remembering you are here." },
            { name: "Ron",      text: "And when you're ready, there's treacle tart. There's always treacle tart. That's a rule of the castle." },
            { name: "Luna",     text: "The thing inside you isn't a monster, Rakshi. It's just a small frightened thing asking to be walked home." },
            { name: "Hermione", text: "You are allowed to be a work in progress and loved at exactly the same time. Both. At once. No contradiction." },
            { name: "Harry",    text: "Whatever tonight looks like, we're not going anywhere. Stay as long as you need. The fire doesn't mind." }
        ]});
    }
}
