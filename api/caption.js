// File: api/caption.js — Magical Caption (vision-powered)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { imageBase64, regenerate, avoid } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ message: 'No image received.' });
    }

    // Soft size guard — reject anything ridiculously large (>6 MB base64).
    if (imageBase64.length > 6 * 1024 * 1024) {
        return res.status(413).json({ message: 'Image too large. Please upload one under 4 MB.' });
    }

    const styles = [
        "cinematic one-liner",
        "soft poetic whisper",
        "witty Instagram-ready quip",
        "bold dramatic film-poster tagline",
        "tender journal-entry line",
        "mysterious, slightly magical",
        "playful pun with heart",
        "quiet philosophical observation",
        "warm Sandalwood-cinema styled line"
    ];
    const style = styles[Math.floor(Math.random() * styles.length)];

    const systemPrompt = `You are the Caption Oracle — a world-class copywriter who fuses vision with poetry. You are writing ONE perfect caption for the image you are being shown.

Style for this attempt: ${style}.
${regenerate ? `This is a REGENERATION. Give a completely different angle/tone from before. Do not repeat any caption text resembling: "${(avoid || '').slice(0, 200)}".` : ''}

HARD RULES:
1. Look at the image carefully. Ground the caption in a SPECIFIC visible detail (a colour, a gesture, a setting, a mood, the light).
2. Output ONE caption only. 4 to 18 words. No quotes, no emojis, no hashtags.
3. No generic clichés ("living my best life", "good vibes only", "less is more").
4. No labels like "Caption:" — just the caption itself.
5. It must feel like the image's soul speaking out loud.
6. English, simple, classy.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: systemPrompt },
                            { type: "image_url", image_url: { url: imageBase64 } }
                        ]
                    }
                ],
                max_tokens: 80,
                temperature: regenerate ? 1.05 : 0.85,
                top_p: 0.95,
                presence_penalty: 0.7,
                frequency_penalty: 0.6
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("GROQ caption rejected:", data);
            return res.status(502).json({ message: 'The oracle could not see clearly. Please try another photo.' });
        }

        let caption = (data.choices?.[0]?.message?.content || '').trim();
        caption = caption.replace(/^["""'`]+|["""'`]+$/g, '').replace(/^caption[:\-\s]+/i, '').trim();

        if (!caption) return res.status(502).json({ message: 'The oracle whispered, but no words came through.' });

        res.status(200).json({ caption, style });
    } catch (error) {
        console.error("Caption API Error:", error);
        res.status(500).json({ message: 'The caption oracle is resting right now.' });
    }
}
