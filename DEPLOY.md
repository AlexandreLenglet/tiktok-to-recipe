# 🚀 Guide de Déploiement - TikTok to Recipe

## Étape 1 : Préparer le code sur GitHub

### 1.1 Créer le dépôt GitHub
1. Va sur [github.com/new](https://github.com/new)
2. Nom du repo : `tiktok-to-recipe`
3. Clique **Create repository**

### 1.2 Push le code
```bash
cd C:\Users\LuffyVlg\.gemini\antigravity\scratch\tiktok-recipe-vercel
git init
git add .
git commit -m "Initial commit - TikTok to Recipe"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/tiktok-to-recipe.git
git push -u origin main
```

---

## Étape 2 : Déployer le Backend sur Render

### 2.1 Créer un compte Render
1. Va sur [render.com](https://render.com)
2. Inscris-toi avec GitHub

### 2.2 Créer le Web Service
1. Dashboard → **New +** → **Web Service**
2. Connecte ton repo GitHub `tiktok-to-recipe`
3. Configure :
   - **Name** : `tiktok-recipe-api`
   - **Region** : Frankfurt (EU)
   - **Root Directory** : `backend`
   - **Runtime** : Python 3
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.3 Variables d'environnement
Dans l'onglet **Environment** :
| Clé | Valeur |
|-----|--------|
| `GEMINI_API_KEY` | `AIzaSyDxNg-RvBcVQxbp6H8y2cb8YIscxsmPUY8` |

### 2.4 Lancer le déploiement
Clique **Create Web Service** et attends ~5 min.

📝 **Note l'URL du backend** (ex: `https://tiktok-recipe-api.onrender.com`)

---

## Étape 3 : Déployer le Frontend sur Vercel

### 3.1 Import sur Vercel
1. Va sur [vercel.com](https://vercel.com)
2. Inscris-toi avec GitHub
3. **Add New...** → **Project**
4. Import ton repo `tiktok-to-recipe`

### 3.2 Configure le projet
- **Framework Preset** : Next.js (auto-détecté)
- **Root Directory** : `.` (racine)

### 3.3 Variables d'environnement
| Clé | Valeur |
|-----|--------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://tiktok-recipe-api.onrender.com` |

*(Remplace par l'URL de ton backend Render)*

### 3.4 Déployer
Clique **Deploy** et attends ~2 min.

🎉 **Ton app est live !**

---

## ✅ Résumé des URLs

| Service | URL |
|---------|-----|
| Backend (Render) | `https://tiktok-recipe-api.onrender.com` |
| Frontend (Vercel) | `https://tiktok-to-recipe.vercel.app` |

---

## ⚠️ Notes importantes

1. **Cold Start Render** : Le premier appel peut prendre 30-60s (le serveur gratuit se met en veille)
2. **Limites Gemini** : L'API gratuite a des quotas (15 req/min, 1M tokens/jour)
3. **yt-dlp** : Fonctionne sur Render car c'est un vrai serveur Linux
