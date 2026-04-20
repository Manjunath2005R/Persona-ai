// File: api/hogwarts.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { emotion } = req.body;

    // We strictly tell the AI to output JSON so our website can read it as a script!
    const systemPrompt = `
    You are writing a short, 3-line interactive script for a magical website.
    A girl named Rakshi is visiting the Gryffindor common room. Her best friend sent her here.
    She is currently feeling: ${emotion}.
    
    Write a comforting, highly in-character conversation between Harry Potter, Hermione Granger, and/or Ron Weasley addressing her feeling. Make them sound exactly like the books/movies.
    
    CRITICAL RULE: You must respond ONLY with a raw JSON array of objects. Do not use markdown blocks (\`\`\`). Do not add any text before or after the array.
    
    Format example:
    [
      {"name": "Hermione", "text": "Rakshi, come sit by the fire. We heard you were having a hard day."},
      {"name": "Ron", "text": "I saved you a Chocolate Frog! It always helps me."},
      {"name": "Harry", "text": "You're safe here with us, Rakshi."}
    ]
    `;

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
        const aiMessage = data.choices[0].message.content.trim();
        
        // Parse the AI's text into an actual Javascript array
        const scriptArray = JSON.parse(aiMessage);

        res.status(200).json({ script: scriptArray });

    } catch (error) {
        console.error("AI Error:", error);
        // Fallback script just in case the AI server is down
        res.status(200).json({ script: [
            {"name": "Hermione", "text": "Rakshi! The magic is a bit unstable today, but we are so glad you're here."},
            {"name": "Harry", "text": "Whatever you are feeling, remember that your best friend is always looking out for you."}
        ]});
    }
}