"""
TikTok to Recipe - FastAPI Backend
Télécharge les vidéos TikTok et les analyse avec Gemini 1.5 Flash
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import subprocess
import tempfile
import os
import time
import json
import re

app = FastAPI(
    title="TikTok to Recipe API",
    description="API pour extraire les recettes des vidéos TikTok",
    version="1.0.0"
)

# Clé API Gemini (configurée au démarrage)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDxNg-RvBcVQxbp6H8y2cb8YIscxsmPUY8")

# Configurer Gemini au démarrage
genai.configure(api_key=GEMINI_API_KEY)

# CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, limiter aux domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    tiktok_url: str


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str
    checked: bool = False


class Step(BaseModel):
    number: int
    title: str
    description: str


class RecipeResponse(BaseModel):
    success: bool
    recipe_name: str = ""
    description: str = ""
    servings: int = 2
    ingredients: list[Ingredient] = []
    steps: list[Step] = []
    tips: list[str] = []
    error: str = ""


# Prompt système pour obtenir une réponse JSON structurée
SYSTEM_PROMPT = """Tu es un chef cuisinier professionnel expert en analyse de recettes.

MISSION : Analyse cette vidéo de cuisine en utilisant la vision et l'audio.

INSTRUCTIONS :
1. Identifie TOUS les ingrédients visibles ou mentionnés.
2. Pour chaque ingrédient, estime la quantité EN NOMBRE (pas de texte comme "une pincée").
3. Utilise toujours des grammes (g) ou millilitres (ml) comme unité.
4. Si une quantité n'est pas claire, estime-la raisonnablement pour 2 personnes.
5. Liste les étapes de préparation dans l'ordre chronologique.

RÉPONDS UNIQUEMENT EN JSON VALIDE avec ce format exact (pas de markdown, pas de ```):

{
  "recipe_name": "Nom du plat",
  "description": "Description courte en 1-2 phrases",
  "servings": 2,
  "ingredients": [
    {"name": "Ingrédient 1", "quantity": 200, "unit": "g"},
    {"name": "Ingrédient 2", "quantity": 100, "unit": "ml"}
  ],
  "steps": [
    {"number": 1, "title": "Préparation", "description": "Description détaillée de l'étape"},
    {"number": 2, "title": "Cuisson", "description": "Description détaillée"}
  ],
  "tips": ["Conseil 1", "Conseil 2"]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans aucun texte avant ou après."""


def is_valid_tiktok_url(url: str) -> bool:
    """Vérifie si l'URL est un lien TikTok valide."""
    url = url.lower().strip()
    valid_domains = ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"]
    return any(domain in url for domain in valid_domains)


def download_tiktok_video(url: str, output_dir: str) -> str | None:
    """Télécharge une vidéo TikTok via yt-dlp."""
    output_template = os.path.join(output_dir, "video.%(ext)s")
    
    cmd = [
        "yt-dlp",
        "--no-warnings",
        "--quiet",
        "-f", "mp4/best[ext=mp4]/best",
        "-o", output_template,
        "--no-playlist",
        url
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            return None
        
        # Chercher le fichier téléchargé
        for file in os.listdir(output_dir):
            if file.startswith("video."):
                return os.path.join(output_dir, file)
        
        return None
        
    except Exception:
        return None


def wait_for_file_active(file, max_wait: int = 90) -> bool:
    """Attend que le fichier uploadé soit prêt (état ACTIVE)."""
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        file_status = genai.get_file(file.name)
        
        if file_status.state.name == "ACTIVE":
            return True
        elif file_status.state.name == "FAILED":
            return False
        
        time.sleep(2)
    
    return False


def parse_recipe_json(text: str) -> dict:
    """Parse le JSON de la réponse Gemini."""
    # Nettoyer le texte
    text = text.strip()
    
    # Enlever les backticks markdown si présents
    if text.startswith("```"):
        text = re.sub(r'^```json?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Essayer de trouver le JSON dans le texte
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        return None


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "TikTok to Recipe API is running"}


@app.post("/api/analyze", response_model=RecipeResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    Analyse une vidéo TikTok et retourne la recette structurée.
    """
    # Validation URL
    if not is_valid_tiktok_url(request.tiktok_url):
        raise HTTPException(status_code=400, detail="URL TikTok invalide")
    
    uploaded_file = None
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # 1. Télécharger la vidéo
            video_path = download_tiktok_video(request.tiktok_url, temp_dir)
            
            if not video_path:
                raise HTTPException(
                    status_code=400, 
                    detail="Impossible de télécharger la vidéo. Vérifiez le lien ou réessayez."
                )
            
            # 2. Upload vers Gemini
            uploaded_file = genai.upload_file(path=video_path, mime_type="video/mp4")
            
            # 3. Attendre que le fichier soit prêt
            if not wait_for_file_active(uploaded_file):
                raise HTTPException(
                    status_code=500, 
                    detail="Le traitement de la vidéo a échoué côté Google"
                )
            
            # 4. Analyser avec Gemini
            model = genai.GenerativeModel(
                "gemini-1.5-flash",
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=4096,
                )
            )
            
            response = model.generate_content([uploaded_file, SYSTEM_PROMPT])
            
            # 5. Parser la réponse JSON
            recipe_data = parse_recipe_json(response.text)
            
            if not recipe_data:
                raise HTTPException(
                    status_code=500, 
                    detail="Impossible de parser la réponse de l'IA"
                )
            
            # 6. Construire la réponse
            ingredients = [
                Ingredient(
                    name=ing.get("name", ""),
                    quantity=float(ing.get("quantity", 0)),
                    unit=ing.get("unit", "g"),
                    checked=False
                )
                for ing in recipe_data.get("ingredients", [])
            ]
            
            steps = [
                Step(
                    number=step.get("number", i + 1),
                    title=step.get("title", f"Étape {i + 1}"),
                    description=step.get("description", "")
                )
                for i, step in enumerate(recipe_data.get("steps", []))
            ]
            
            return RecipeResponse(
                success=True,
                recipe_name=recipe_data.get("recipe_name", "Recette"),
                description=recipe_data.get("description", ""),
                servings=recipe_data.get("servings", 2),
                ingredients=ingredients,
                steps=steps,
                tips=recipe_data.get("tips", [])
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        finally:
            # Nettoyage du fichier sur Google
            if uploaded_file:
                try:
                    genai.delete_file(uploaded_file.name)
                except:
                    pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
