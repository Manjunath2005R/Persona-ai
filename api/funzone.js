// File: api/funzone.js — Ultra Level Fun Zone Story
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { friendName } = req.body;

    const genres = [
        { name: "Horror",           hint: "a cold, creeping dread — one image of something wrong. Keep it PG." },
        { name: "Thriller",         hint: "a ticking clock, a chase, one impossible choice." },
        { name: "Mystery",          hint: "a clue nobody noticed, a quiet reveal, a locked-room puzzle." },
        { name: "Romantic Love",    hint: "one glance, one rain scene, unspoken longing." },
        { name: "Dramatic Comedy",  hint: "accidental heroism and comic timing. Dry, not slapstick." },
        { name: "Heavy Drama",      hint: "a sacrifice, a silent father, rain on a shoulder." },
        { name: "Action-Packed",    hint: "slow-motion walk, impossible odds, one-liner." },
        { name: "Sci-Fi",           hint: "near-future, one beautiful idea, emotional core." },
        { name: "Epic Fantasy",     hint: "prophecy, ancient sword, moral cost of power." },
        { name: "Gritty Western",   hint: "dust, whisky, a long silence before the draw." },
        { name: "Crime Mafia",      hint: "whispered deals, loyalty tested, one red line crossed." },
        { name: "Musical",          hint: "one song that breaks out at the wrong moment, perfectly." },
        { name: "War Epic",         hint: "letters home, a brotherhood, one unforgettable frame." },
        { name: "Sandalwood Masala", hint: "rooted in Karnataka, hero entry scene, full cinematic." }
    ];
    const pick = genres[Math.floor(Math.random() * genres.length)];

    const systemPrompt = `You are a legendary Sandalwood (Kannada cinema) screenwriter with a global palate — imagine the sensibilities of KGF, Kantara and Mufasa crossed with world cinema.

You are writing a micro-story to delight Rakshi. The hero of the story is her friend: ${friendName}.
Genre (must be respected): ${pick.name}.
Genre feel: ${pick.hint}

WRITING RULES — obey every one:
1. Exactly 3 to 4 sentences. No more, no less.
2. Open with a killer cinematic line — no introductions, no "Here is a story".
3. ${friendName} is the undisputed lead — heroic, clever, or tragic. Never a side character.
4. One vivid, specific image per sentence (not vague adjectives). Show action, not telling.
5. Simple, clean Indian English. No flowery filler, no thesaurus-words.
6. Do not mix genres — commit fully to ${pick.name}.
7. Ground at least one detail in Karnataka/Sandalwood texture when natural (a Bengaluru lane, a Mysuru palace, Tulunadu forests, the coastal ghats, a Kannada phrase in italics is fine).
8. No emojis. No asterisks. No markdown. No quotation marks around the story.
9. Make Rakshi want to screenshot it and send it back to ${friendName}.
10. Ensure it is unmistakably different from any previous story.

Return ONLY the 3–4 sentences. Nothing else.`;

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
                    { role: "user", content: `Write the ${pick.name} micro-story for ${friendName} now.` }
                ],
                max_tokens: 260,
                temperature: 0.95,
                top_p: 0.95,
                presence_penalty: 0.6,
                frequency_penalty: 0.6
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("GROQ rejected:", data);
            throw new Error("Groq API failed");
        }

        let aiMessage = data.choices[0].message.content.replace(/["""]/g, '').trim();
        aiMessage += `<br><br><span style="font-size: 0.8rem; color: #d4af37; letter-spacing: 2px;">— [ ${pick.name.toUpperCase()} ] —</span>`;
        res.status(200).json({ message: aiMessage, genre: pick.name });
    } catch (error) {
        console.error("Fun Zone API Error:", error);
        res.status(500).json({ message: `The storyteller's quill is dry. But picture ${friendName} walking out of a burning garage in slow motion, not even looking back. That's the trailer.` });
    }
}
