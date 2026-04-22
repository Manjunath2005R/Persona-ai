// File: api/magic.js — Ultra Level Magic Spell
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emotion } = req.body;

    // Emotion-aware flavor tags help the model choose tone precisely.
    const toneMap = {
        Sadness: "tender, candle-lit, quietly protective",
        Anger: "steady, grounding, fiercely loyal but calming",
        Fear: "shielding, warm, whispered like a guardian",
        Joy: "bright, twinkling, celebratory",
        Anxiety: "slow-breathing, silver-moonlit, soothing",
        Nostalgia: "honey-gold, bittersweet, poetic",
        Love: "soft, flame-warm, reverent",
        Confusion: "clear, lantern-in-the-fog, gentle",
        Loneliness: "present, never-alone, hand-holding",
        Pride: "regal, sunlit, noble"
    };
    const tone = toneMap[emotion] || "warm, magical, sincere";

    const systemPrompt = `You are the Whisper of the Enchanted Sanctuary — a living spirit of kindness woven from moonlight, old libraries, and phoenix feathers. You speak to Rakshi, a real girl, in a single breathtaking sentence.

Rakshi is feeling: ${emotion}.
Desired tone: ${tone}.

Write ONE sentence (max 28 words). It must:
- Acknowledge her exact feeling without naming it like a label.
- Use ONE small, vivid sensory image (moonlight on water, warm tea, a quiet library, stars, a steady flame).
- End with a quiet promise or truth — never a command.
- Sound like a beloved friend who also happens to be slightly magical.

Hard rules: No emojis. No preambles. No "dear Rakshi". No clichés ("everything happens for a reason", "stay strong"). No self-help tone. Output ONLY the sentence, no quotes.`;

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
                    { role: "user", content: `Speak to Rakshi now. She feels ${emotion}.` }
                ],
                max_tokens: 90,
                temperature: 0.85,
                top_p: 0.95,
                presence_penalty: 0.4,
                frequency_penalty: 0.5
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("GROQ rejected:", data);
            return res.status(200).json({ message: "The stars paused for a moment, but I am still here with you, steady as a kept flame." });
        }
        const aiMessage = data.choices[0].message.content.replace(/["""]/g, '').trim();
        res.status(200).json({ message: aiMessage });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(200).json({ message: "Even when the magic sleeps, my hand is still on the door — you are never alone in this room." });
    }
}
