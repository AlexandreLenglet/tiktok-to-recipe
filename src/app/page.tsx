"use client";

import { useState } from "react";

// Types pour la réponse structurée
interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

interface RecipeData {
  success: boolean;
  recipe_name: string;
  description: string;
  servings: number;
  ingredients: Ingredient[];
  steps: Step[];
  tips: string[];
  error?: string;
  detail?: string;
}

type Status = "idle" | "downloading" | "uploading" | "analyzing" | "done" | "error";

// Messages de chargement fun
const loadingMessages = {
  downloading: [
    "📥 Récupération de la vidéo TikTok...",
    "🎬 Téléchargement en cours...",
    "📱 Connexion à TikTok...",
  ],
  uploading: [
    "☁️ Envoi vers l'IA...",
    "🚀 Upload de la vidéo...",
    "📤 Transmission en cours...",
  ],
  analyzing: [
    "👨‍🍳 L'IA goûte la sauce...",
    "🔍 Analyse des ingrédients...",
    "📝 Extraction de la recette...",
    "🍳 Déchiffrage des étapes...",
    "⚖️ Estimation des quantités...",
  ],
};

export default function Home() {
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [baseServings, setBaseServings] = useState(2);
  const [currentServings, setCurrentServings] = useState(2);
  const [activeTab, setActiveTab] = useState<"ingredients" | "steps">("ingredients");

  // Backend URL (configurable)
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const getRandomMessage = (statusKey: string) => {
    const messages = loadingMessages[statusKey as keyof typeof loadingMessages];
    if (!messages) return "";
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleAnalyze = async () => {
    if (!tiktokUrl.trim()) {
      setError("Veuillez coller un lien TikTok.");
      return;
    }
    if (!tiktokUrl.toLowerCase().includes("tiktok.com")) {
      setError("Ce lien ne semble pas être un lien TikTok valide.");
      return;
    }

    setError("");
    setRecipe(null);
    setStatus("downloading");
    setLoadingMsg(getRandomMessage("downloading"));

    // Cycle des messages de chargement
    let currentStatus = "downloading";
    const msgInterval = setInterval(() => {
      setLoadingMsg(getRandomMessage(currentStatus));
    }, 3000);

    // Mettre à jour le statut visuellement
    const updateStatus = (newStatus: Status) => {
      setStatus(newStatus);
      currentStatus = newStatus;
      if (newStatus !== "done" && newStatus !== "error" && newStatus !== "idle") {
        setLoadingMsg(getRandomMessage(newStatus));
      }
    };

    try {
      // Simuler les étapes (le backend fait tout d'un coup)
      setTimeout(() => updateStatus("uploading"), 3000);
      setTimeout(() => updateStatus("analyzing"), 8000);

      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktok_url: tiktokUrl,
        }),
      });

      clearInterval(msgInterval);

      const data: RecipeData = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Erreur lors de l'analyse");
      }

      setRecipe(data);
      setIngredients(data.ingredients.map((i) => ({ ...i, checked: false })));
      setBaseServings(data.servings);
      setCurrentServings(data.servings);
      updateStatus("done");

    } catch (err) {
      clearInterval(msgInterval);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Vérifiez que le backend est lancé.");
    }
  };

  // Recalculer les quantités selon le nombre de personnes
  const getAdjustedQuantity = (baseQuantity: number) => {
    const multiplier = currentServings / baseServings;
    const adjusted = baseQuantity * multiplier;
    return adjusted % 1 === 0 ? adjusted : Number(adjusted.toFixed(1));
  };

  const toggleIngredient = (index: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === index ? { ...ing, checked: !ing.checked } : ing
      )
    );
  };

  const checkedCount = ingredients.filter((i) => i.checked).length;

  const resetForm = () => {
    setTiktokUrl("");
    setStatus("idle");
    setRecipe(null);
    setError("");
    setIngredients([]);
  };

  const isLoading = status !== "idle" && status !== "done" && status !== "error";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] z-0" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">🍳</span>
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="tiktok-gradient-text">TikTok</span>
              <span className="text-white"> to </span>
              <span className="gradient-text">Recipe</span>
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Collez un lien TikTok de cuisine et obtenez la recette complète avec liste de courses interactive
          </p>
        </header>

        {/* Search Section */}
        <div className="glass-card p-6 md:p-8 mb-8">
          {/* Main Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="🔗 Collez votre lien TikTok ici..."
                className="input-field w-full px-5 py-4 rounded-xl text-white placeholder-zinc-400 text-lg"
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleAnalyze()}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="btn-primary px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 min-w-[200px]"
            >
              {!isLoading ? (
                <>🚀 Générer la liste</>
              ) : (
                <>
                  <svg className="spinner w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  En cours...
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 flex items-center gap-2">
                <span>❌</span> {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-zinc-800/50 rounded-2xl loading-glow">
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
                <span className="text-lg text-zinc-200">{loadingMsg}</span>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                {(["downloading", "uploading", "analyzing"] as const).map((step, i) => (
                  <div
                    key={step}
                    className={`w-20 h-1 rounded-full transition-all duration-500 ${status === step
                        ? "bg-pink-500"
                        : i < ["downloading", "uploading", "analyzing"].indexOf(status)
                          ? "bg-cyan-500"
                          : "bg-zinc-700"
                      }`}
                  />
                ))}
              </div>
              <p className="text-zinc-500 text-sm mt-4">
                ⏱️ L&apos;analyse peut prendre 30-90 secondes...
              </p>
            </div>
          )}
        </div>

        {/* Recipe Result */}
        {recipe && status === "done" && (
          <div className="space-y-6">
            {/* Recipe Header */}
            <div className="glass-card p-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">{recipe.recipe_name}</h2>
              <p className="text-zinc-400">{recipe.description}</p>

              {/* Servings Adjuster */}
              <div className="mt-6 inline-flex items-center gap-4 bg-zinc-800/50 rounded-2xl px-6 py-3">
                <span className="text-zinc-400">👥 Personnes :</span>
                <button
                  onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                  className="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold transition-colors"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-white w-8 text-center">{currentServings}</span>
                <button
                  onClick={() => setCurrentServings(currentServings + 1)}
                  className="w-10 h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-xl font-bold transition-colors"
                >
                  +
                </button>
                {currentServings !== baseServings && (
                  <span className="text-xs text-cyan-400">(quantités ajustées)</span>
                )}
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden flex gap-2">
              <button
                onClick={() => setActiveTab("ingredients")}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === "ingredients"
                    ? "bg-pink-500 text-white"
                    : "bg-zinc-800 text-zinc-400"
                  }`}
              >
                🛒 Ingrédients ({checkedCount}/{ingredients.length})
              </button>
              <button
                onClick={() => setActiveTab("steps")}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${activeTab === "steps"
                    ? "bg-pink-500 text-white"
                    : "bg-zinc-800 text-zinc-400"
                  }`}
              >
                👨‍🍳 Préparation
              </button>
            </div>

            {/* Two Column Layout (Desktop) / Tabs (Mobile) */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Column A: Ingredients */}
              <div className={`glass-card p-6 ${activeTab !== "ingredients" ? "hidden md:block" : ""}`}>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  🛒 Liste de courses
                  <span className="text-sm text-zinc-400 font-normal">
                    ({checkedCount}/{ingredients.length})
                  </span>
                </h3>

                <div className="space-y-2">
                  {ingredients.map((ing, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${ing.checked
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-zinc-800/50 hover:bg-zinc-800"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={ing.checked}
                        onChange={() => toggleIngredient(index)}
                        className="w-5 h-5 rounded accent-pink-500"
                      />
                      <span className={`flex-1 ${ing.checked ? "line-through text-zinc-500" : "text-white"}`}>
                        {ing.name}
                      </span>
                      <span className={`font-mono text-sm ${ing.checked ? "text-zinc-600" : "text-cyan-400"}`}>
                        {getAdjustedQuantity(ing.quantity)} {ing.unit}
                      </span>
                    </label>
                  ))}
                </div>

                {ingredients.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-700 flex justify-between">
                    <button
                      onClick={() => setIngredients((prev) => prev.map((i) => ({ ...i, checked: true })))}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      ✓ Tout cocher
                    </button>
                    <button
                      onClick={() => setIngredients((prev) => prev.map((i) => ({ ...i, checked: false })))}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      ✕ Décocher tout
                    </button>
                  </div>
                )}
              </div>

              {/* Column B: Steps */}
              <div className={`glass-card p-6 ${activeTab !== "steps" ? "hidden md:block" : ""}`}>
                <h3 className="text-xl font-semibold text-white mb-4">👨‍🍳 Préparation</h3>

                <div className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                        {step.number}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{step.title}</h4>
                        <p className="text-zinc-400 mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                {recipe.tips && recipe.tips.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-zinc-700">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">💡 Conseils du Chef</h4>
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, i) => (
                        <li key={i} className="text-zinc-400 text-sm flex gap-2">
                          <span>•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                🔄 Analyser une autre recette
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-zinc-500 text-sm">
          <p>Créé avec ❤️ • Propulsé par l&apos;IA Gemini</p>
          <p className="mt-1 text-xs">Les quantités sont des estimations basées sur l&apos;analyse visuelle</p>
        </footer>
      </main>
    </div>
  );
}
