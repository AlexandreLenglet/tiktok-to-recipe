import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Vercel Pro: 60s timeout

const SYSTEM_PROMPT = `Tu es un chef cuisinier professionnel expert en analyse de recettes.

MISSION : Analyse cette vidéo de cuisine en utilisant à la fois la vision (ce que tu vois) et l'audio (ce que tu entends).

INSTRUCTIONS STRICTES :
1. Identifie TOUS les ingrédients visibles ou mentionnés dans la vidéo.
2. Pour chaque ingrédient, estime la quantité EN GRAMMES (g) ou en millilitres (ml) pour les liquides.
   - Si la quantité est dite explicitement, utilise-la.
   - Sinon, fais une estimation raisonnable basée sur ce que tu vois.
3. Liste les étapes de préparation dans l'ordre chronologique.
4. Ajoute des conseils de chef si pertinent.

FORMAT DE SORTIE (Markdown strict) :

# 🍽️ [Nom de la Recette]

## 📝 Description
[Brève description du plat en 1-2 phrases]

## 🛒 Liste des Courses

| Ingrédient | Quantité |
|------------|----------|
| [Nom] | [X g ou ml] |
| ... | ... |

## 👨‍🍳 Étapes de Préparation

1. **[Titre étape 1]** : [Description détaillée]
2. **[Titre étape 2]** : [Description détaillée]
...

## 💡 Conseils du Chef
- [Conseil 1]
- [Conseil 2]

---
*Recette extraite automatiquement par TikTok to Recipe*`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { apiKey, videoBase64, mimeType } = body;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Clé API manquante" },
                { status: 400 }
            );
        }

        if (!videoBase64) {
            return NextResponse.json(
                { error: "Vidéo manquante" },
                { status: 400 }
            );
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
            }
        });

        // Create the content with inline video data
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType || "video/mp4",
                    data: videoBase64,
                },
            },
            { text: SYSTEM_PROMPT },
        ]);

        const response = await result.response;
        const recipe = response.text();

        return NextResponse.json({ recipe });

    } catch (error) {
        console.error("Error analyzing video:", error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key")) {
                return NextResponse.json(
                    { error: "Clé API invalide. Vérifiez votre clé Google Gemini." },
                    { status: 401 }
                );
            }
            if (error.message.includes("SAFETY")) {
                return NextResponse.json(
                    { error: "La vidéo a été bloquée par les filtres de sécurité." },
                    { status: 400 }
                );
            }
            if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
                return NextResponse.json(
                    { error: "Quota API dépassé. Réessayez plus tard." },
                    { status: 429 }
                );
            }
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Une erreur inattendue est survenue" },
            { status: 500 }
        );
    }
}
