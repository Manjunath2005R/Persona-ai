// File: api/funzone.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { friendName } = req.body;
    
    // We force the code to randomly pick a genre BEFORE it even talks to the AI!
    const genres = [
        "Horror", "Thriller", "Mystery", "Romantic Love", "Dramatic Comedy", 
        "Heavy Drama", "Action-Packed", "Sci-Fi", "Epic Fantasy", 
        "Gritty Western", "Crime Mafia", "Animated Feature", "Musical", "War Epic"
    ];
    const selectedGenre = genres[Math.floor(Math.random() * genres.length)];
    
    const systemPrompt = `You are a legendary Sandalwood screenwriter. 
    A girl named Rakshi wants to read a highly engaging, cinematic micro-story about her friend: ${friendName}. 
    
    The genre of this story MUST be: ${selectedGenre}.
    
    Rules:
    1. Take the genre SERIOUSLY. If it's Horror, make it spooky. If it's Sci-Fi, make it futuristic. If it's a War Epic, make it intense.
    2. Feature ${friendName} as the absolute main character (a badass hero, a dramatic lead, a genius detective, etc.).
    3. Keep it to exactly 3 to 4 sentences. It should read exactly like a dramatic movie trailer description or a serious book excerpt.
    4. Always try to impress the girl named Rakshi by your stories and enhance your quality for story telling.
    5. Do NOT use emojis.
    6. Use simple understandable indian english.
    7. Do not introduce the story. Do not say "Here is a story." Just immediately start telling the dramatic story.
    8. Ensure the story is completely unique and highly creative.`;

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
                temperature: 0.9 // High temperature ensures completely unique stories every time
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("GROQ API REJECTED REQUEST:", data);
            throw new Error("Groq API failed");
        }

        let aiMessage = data.choices[0].message.content.replace(/"/g, '').trim();
        
        // Add a small tag at the end so Rakshi knows what genre she got!
        aiMessage += `<br><br><span style="font-size: 0.8rem; color: #d4af37;">[Genre: ${selectedGenre}]</span>`;

        res.status(200).json({ message: aiMessage });

    } catch (error) {
        console.error("Fun Zone API Error:", error);
        res.status(500).json({ message: `The storyteller is resting. But just imagine ${friendName} fighting a dragon. It's basically the same thing.` });
    }
}
