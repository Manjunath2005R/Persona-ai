export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emotion } = req.body;
    const systemPrompt = `You are writing a short, 3-line interactive script for a magical website. A girl named Rakshi is visiting the Gryffindor common room. Her best friend sent her here. She is currently feeling: ${emotion}. Write a comforting, highly in-character conversation between Harry Potter, Hermione Granger, and/or Ron Weasley addressing her feeling. Make them sound exactly like the books/movies. CRITICAL RULE: You must respond ONLY with a raw JSON array of objects. Do not use markdown blocks. Format example: [{"name": "Hermione", "text": "Rakshi, come sit by the fire."}]`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [{ role: "system", content: systemPrompt }],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // SAFETY NET
        if (!response.ok) {
            console.error("GROQ API REJECTED REQUEST:", data);
            throw new Error("Groq API failed");
        }

        const aiMessage = data.choices[0].message.content.trim();
        const scriptArray = JSON.parse(aiMessage);
        res.status(200).json({ script: scriptArray });

    } catch (error) {
        console.error("Hogwarts API Error:", error);
        // Fallback script if AI fails
        res.status(200).json({ script: [
            {"name": "Hermione", "text": "Rakshi! The magic is a bit unstable today, but we are so glad you're here."},
            {"name": "Harry", "text": "Whatever you are feeling, remember that your best friend is always looking out for you."}
        ]});
    }
}
