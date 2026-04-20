// File: api/funzone.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { friendName } = req.body;
    
    const genres = [
        "Horror", "Thriller", "Mystery", "Romantic Love", "Dramatic Comedy", 
        "Heavy Drama", "Action-Packed", "Sci-Fi", "Epic Fantasy", 
        "Crime Mafia", "War Epic"
    ];
    const selectedGenre = genres[Math.floor(Math.random() * genres.length)];
    
    const systemPrompt = `You are a creative storyteller. A girl named Rakshi wants to read a highly engaging, cinematic micro-story about her friend: ${friendName}. 
    
    The genre of this story MUST be: ${selectedGenre}.
    
    CRITICAL RULES:
    1. You MUST write the story ENTIRELY in the Kannada language (ಕನ್ನಡ ಲಿಪಿ). 
    2. Use simple, everyday, conversational Kannada words that are very easy to understand. Do not use complex, textbook, or ancient vocabulary.
    3. Take the genre seriously. If it's Horror, make it spooky. If it's Sci-Fi, make it futuristic.
    4. Feature ${friendName} as the absolute main character.
    5. Keep it to exactly 3 to 4 sentences. 
    6. Do NOT use emojis. 
    7. Do not introduce the story. Just start telling the story immediately in Kannada.`;

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
                max_tokens: 250, // Slightly increased because Kannada text can take up more tokens
                temperature: 0.9 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("GROQ API REJECTED REQUEST:", data);
            throw new Error("Groq API failed");
        }

        let aiMessage = data.choices[0].message.content.replace(/"/g, '').trim();
        
        // Adds the Genre tag at the bottom in English so she knows the theme!
        aiMessage += `<br><br><span style="font-size: 0.8rem; color: #d4af37;">[Genre: ${selectedGenre}]</span>`;

        res.status(200).json({ message: aiMessage });

    } catch (error) {
        console.error("Fun Zone API Error:", error);
        res.status(500).json({ message: `ಕ್ಷಮಿಸಿ, ಕಥೆಗಾರರು ಈಗ ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತಿದ್ದಾರೆ. ಆದರೆ ${friendName} ಬಗ್ಗೆ ಯೋಚಿಸಿ ನಗಿ! (The storyteller is resting...)` });
    }
}
