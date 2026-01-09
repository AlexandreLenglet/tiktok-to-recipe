# 🍳 TikTok to Recipe

Application web complète pour extraire automatiquement les recettes de vidéos TikTok.

**Architecture Pro :** Next.js (Frontend) + FastAPI (Backend) + yt-dlp + Gemini 1.5 Flash

---

## 🚀 Lancement en Local

### 1. Backend (FastAPI + Python)

```bash
cd backend

# Créer environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
python main.py
```

Le backend tourne sur `http://localhost:8000`

### 2. Frontend (Next.js)

```bash
# Depuis la racine du projet
npm install
npm run dev
```

Le frontend tourne sur `http://localhost:3000`

---

## 🌐 Déploiement en Production

### Backend (Render, Railway, ou VPS)

1. **Render.com** (gratuit) :
   - Créer un "Web Service"
   - Connecter le repo GitHub
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Ajouter variable d'env: `GEMINI_API_KEY=ta_clé`

### Frontend (Vercel)

1. Déployer sur Vercel
2. Ajouter variable d'env: `NEXT_PUBLIC_BACKEND_URL=https://ton-backend.render.com`

---

## ✨ Fonctionnalités

- 🔗 **Input URL TikTok** - Colle le lien et c'est tout
- 📥 **Téléchargement auto** - Via yt-dlp (gratuit)
- 🤖 **Analyse IA** - Gemini 1.5 Flash (vision + audio)
- 🛒 **Checklist interactive** - Coche les ingrédients
- ⚖️ **Ajusteur de portions** - Recalcule les quantités
- 📱 **Responsive** - 2 colonnes desktop, tabs mobile
