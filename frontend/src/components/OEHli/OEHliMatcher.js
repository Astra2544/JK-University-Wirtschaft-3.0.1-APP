/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  OEHLI MATCHER | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Matching-Algorithmus fuer den OEHli Chatbot.
 *  Findet die beste Antwort basierend auf Keyword-Matching.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import knowledge from './OEHliKnowledge';

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'a')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(/\s+/).filter(Boolean);
}

function computeScore(query, keywords) {
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);
  let bestScore = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalize(keyword);
    let score = 0;

    if (normalizedQuery === normalizedKeyword) {
      score = 100;
    } else if (normalizedQuery.includes(normalizedKeyword)) {
      score = 70 + (normalizedKeyword.length / normalizedQuery.length) * 20;
    } else if (normalizedKeyword.includes(normalizedQuery)) {
      score = 60 + (normalizedQuery.length / normalizedKeyword.length) * 20;
    } else {
      const keywordTokens = tokenize(keyword);
      let matchedTokens = 0;
      let partialScore = 0;

      for (const qt of queryTokens) {
        for (const kt of keywordTokens) {
          if (qt === kt) {
            matchedTokens++;
            partialScore += 15;
          } else if (kt.startsWith(qt) || qt.startsWith(kt)) {
            matchedTokens += 0.7;
            partialScore += 10;
          } else if (kt.includes(qt) || qt.includes(kt)) {
            matchedTokens += 0.4;
            partialScore += 6;
          }
        }
      }

      if (matchedTokens > 0) {
        const coverage = matchedTokens / Math.max(queryTokens.length, keywordTokens.length);
        score = partialScore + coverage * 30;
      }
    }

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

export function findResponse(query) {
  if (!query || query.trim().length === 0) {
    return null;
  }

  const greetingScore = computeScore(query, knowledge.greeting.keywords);
  if (greetingScore > 40) {
    return {
      text: knowledge.greeting.response,
      buttons: knowledge.greeting.buttons,
    };
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const category of knowledge.categories) {
    const score = computeScore(query, category.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  if (bestMatch && bestScore > 25) {
    return {
      text: bestMatch.response,
      buttons: bestMatch.buttons || [],
    };
  }

  return {
    text: knowledge.fallback.response,
    buttons: knowledge.fallback.buttons,
  };
}

export function getQuickActions() {
  return knowledge.quickActions;
}

export function getGreeting() {
  return {
    text: knowledge.greeting.response,
    buttons: knowledge.greeting.buttons,
  };
}
