// File: api/menu.js — Magical Menu (cooking guide)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { category, avoidList } = req.body || {};
    const allowed = ['North', 'South', 'Snacks'];
    if (!allowed.includes(category)) {
        return res.status(400).json({ message: 'Invalid category. Choose North, South or Snacks.' });
    }

    const hints = {
        North:  "North Indian home cooking — think dal makhani, chole, rajma chawal, paneer butter masala, baingan bharta, biryani, parathas, pulao, kadhi, aloo gobi. Pick varied regions (Punjab, UP, Rajasthan, Kashmir, Delhi).",
        South:  "South Indian home cooking — dosa varieties, sambar, rasam, bisi bele bath, Mysore masala dosa, Chettinad chicken, appam with stew, avial, puliyogare, akki rotti, ragi mudde, Mangalorean curries, Hyderabadi biryani, Kerala fish moilee.",
        Snacks: "Indian snacks and street food — masala puri, pani puri, dabeli, pav bhaji, mirchi bajji, Mysore bonda, medu vada, samosa, kachori, keema pav, egg puff, masala corn, cutlets, chaats, chakli, nippattu."
    };

    const avoid = Array.isArray(avoidList) ? avoidList.filter(Boolean).slice(0, 25) : [];
    const avoidBlock = avoid.length
        ? `\n\nSTRICT: Do NOT suggest any of these previously shown dishes (or close variations of them): ${avoid.map(n => `"${n}"`).join(', ')}. Pick something clearly different.`
        : '';

    const systemPrompt = `You are Paati's Kitchen Oracle — a warm, expert Indian home chef who has cooked for decades and teaches with clarity. You are writing a cooking guide for Rakshi.

Category: ${category}
Cuisine hint: ${hints[category]}
${avoidBlock}

Rules:
1. Pick ONE dish that feels exciting and home-makeable tonight — not overly fancy, not boring.
2. Use simple, clean Indian English. Short direct sentences a beginner can follow.
3. Ingredients: list with simple home measures (cups, tsp, tbsp, "a handful", "1 medium onion").
4. Steps: numbered, 6 to 10 short actionable steps. Each step one clear action.
5. Include realistic prep time, cook time, servings.
6. One genuine chef's tip at the end — something that actually changes the outcome.
7. No emojis. No markdown asterisks. No preamble. Output ONLY the JSON below.

OUTPUT STRICT JSON SHAPE (no extra keys, no extra prose):
{
  "name": "string — the dish name, clean, no extra words",
  "region": "string — the specific region or tradition",
  "description": "string — one mouth-watering sentence about the dish",
  "serves": "string — e.g., '2 people'",
  "prepTime": "string — e.g., '15 minutes'",
  "cookTime": "string — e.g., '30 minutes'",
  "ingredients": ["string", "string", ...],
  "steps": ["string", "string", ...],
  "tip": "string — one genuine chef's tip"
}`;

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
                    { role: "user", content: `Give Rakshi a ${category} dish recipe now.${avoid.length ? ' Avoid repeats.' : ''}` }
                ],
                max_tokens: 1200,
                temperature: 0.95,
                top_p: 0.95,
                presence_penalty: 0.5,
                frequency_penalty: 0.6,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("GROQ menu rejected:", data);
            throw new Error("Groq API failed");
        }

        let raw = data.choices[0].message.content.trim();
        let recipe;
        try { recipe = JSON.parse(raw); }
        catch (e) {
            const m = raw.match(/\{[\s\S]*\}/);
            recipe = m ? JSON.parse(m[0]) : null;
        }

        if (!recipe || !recipe.name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
            throw new Error("Bad recipe shape");
        }

        // Sanitise & trim.
        recipe.name        = String(recipe.name).trim();
        recipe.region      = String(recipe.region || '').trim();
        recipe.description = String(recipe.description || '').trim();
        recipe.serves      = String(recipe.serves || '').trim();
        recipe.prepTime    = String(recipe.prepTime || '').trim();
        recipe.cookTime    = String(recipe.cookTime || '').trim();
        recipe.tip         = String(recipe.tip || '').trim();
        recipe.ingredients = recipe.ingredients.map(s => String(s).trim()).filter(Boolean).slice(0, 25);
        recipe.steps       = recipe.steps.map(s => String(s).trim()).filter(Boolean).slice(0, 14);

        res.status(200).json({ recipe });
    } catch (error) {
        console.error("Menu API Error:", error);
        const fallback = {
            name: category === 'North' ? 'Jeera Aloo' : category === 'South' ? 'Tomato Rice' : 'Masala Corn Chaat',
            region: category === 'North' ? 'North India' : category === 'South' ? 'South India' : 'Indian street food',
            description: 'A quick, warming, everyday favourite that tastes better than it looks.',
            serves: '2 people',
            prepTime: '10 minutes',
            cookTime: '15 minutes',
            ingredients: ['2 medium potatoes', '1 tsp cumin seeds', '2 tbsp oil', 'Salt to taste', 'Red chilli powder', 'Fresh coriander'],
            steps: [
                'Boil and peel the potatoes, cut into small cubes.',
                'Heat oil in a pan on medium flame.',
                'Add cumin seeds and let them crackle.',
                'Add potatoes and toss to coat with oil.',
                'Add salt and red chilli powder.',
                'Cook for 5 minutes, tossing occasionally.',
                'Finish with fresh coriander and serve hot.'
            ],
            tip: 'Cool the boiled potatoes fully before cubing — they hold their shape and crisp up beautifully.'
        };
        res.status(200).json({ recipe: fallback, fallback: true });
    }
}
