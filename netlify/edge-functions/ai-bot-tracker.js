// netlify/edge-functions/ai-bot-tracker.js
//
// Détecte les crawlers IA connus (qui n'exécutent pas de JavaScript,
// donc invisibles pour le tag Matomo classique) et envoie un hit
// à Matomo via son API HTTP Tracking, avant de servir la page.
//
// Variable d'environnement à définir dans Netlify (Site settings > Environment variables) :
//   MATOMO_TOKEN_AUTH  -> le jeton d'authentification Matomo
//                         (Administration > Utilisateurs > icône clé, dans Matomo)

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "Diffbot",
  "YouBot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "cohere-ai",
  "Timpibot",
  "ImagesiftBot",
  "Omgilibot",
  "FacebookBot",
  "Bingbot", // décommente/retire selon ce que tu considères "IA"
];

const MATOMO_URL = "https://vigie.siweb.13080.fr/matomo.php";
const MATOMO_SITE_ID = "1"; // <-- remplace par l'idSite réel de ciq.13080.fr dans Matomo

export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const isAiBot = AI_BOTS.some((bot) => ua.toLowerCase().includes(bot.toLowerCase()));

  if (isAiBot) {
    const ip =
      context.ip ||
      request.headers.get("x-nf-client-connection-ip") ||
      request.headers.get("x-forwarded-for") ||
      "";
    const token = Deno.env.get("MATOMO_TOKEN_AUTH") || "";

    const params = new URLSearchParams({
      idsite: MATOMO_SITE_ID,
      rec: "1",
      url: request.url,
      ua: ua,
      apiv: "1",
      rand: String(Math.random()).slice(2),
      cip: ip,
      action_name: "Robot IA: " + ua,
    });
    if (token) params.set("token_auth", token);

    // Envoi en tâche de fond : ne bloque pas la réponse servie au robot
    context.waitUntil(
      fetch(`${MATOMO_URL}?${params.toString()}`).catch(() => {})
    );
  }

  // Dans tous les cas, on sert la page normalement
  return context.next();
};

export const config = { path: "/*" };
