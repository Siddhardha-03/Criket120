const axios = require('axios');
const cheerio = require('cheerio');

const CRICBUZZ_LIVE_URL = 'https://www.cricbuzz.com/cricket-match/live-scores';
const API_TIMEOUT = 10000;

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return '';
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const str = String(value).trim();
  if (!str) {
    return null;
  }

  const lowered = str.toLowerCase();
  if (['data not found', 'na', 'null', 'none'].includes(lowered)) {
    return null;
  }

  return str;
}

function isLikelyLiveStatus(status) {
  const cleaned = cleanText(status);
  if (!cleaned) {
    return false;
  }

  const lower = cleaned.toLowerCase();
  const keywords = [
    'live',
    'need',
    'trail',
    'lead',
    'stumps',
    'session',
    'day',
    'overs',
    'in progress',
    'drinks',
    'innings',
    'target'
  ];

  return keywords.some((keyword) => lower.includes(keyword));
}

function extractMatchesArray(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.matches)) {
    return payload.matches;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.response && Array.isArray(payload.response.matches)) {
    return payload.response.matches;
  }

  if (payload.results && Array.isArray(payload.results.matches)) {
    return payload.results.matches;
  }

  if (payload.result && Array.isArray(payload.result.matches)) {
    return payload.result.matches;
  }

  return [];
}

function normalizeApiMatch(match) {
  if (!match || typeof match !== 'object') {
    return null;
  }

  const id =
    match.id ||
    match.matchId ||
    match.match_id ||
    match.matchid ||
    match.unique_id ||
    match.mid ||
    match.series_id;

  if (!id) {
    return null;
  }

  const titleCandidates = [
    match.title,
    match.matchTitle,
    match.name,
    match.match,
    match.shortName,
    match.event,
    match.header,
    match.series,
    `${match.team1 || match.homeTeam || ''} vs ${match.team2 || match.awayTeam || ''}`
  ];

  const title = titleCandidates.map(cleanText).find(Boolean) || `Match ${id}`;

  const statusCandidates = [match.status, match.state, match.result, match.message, match.header]
    .map(cleanText)
    .filter(Boolean);

  const isLive =
    typeof match.isLive === 'boolean'
      ? match.isLive
      : typeof match.matchStarted !== 'undefined'
        ? Boolean(match.matchStarted)
        : statusCandidates.some(isLikelyLiveStatus);

  if (!isLive) {
    return null;
  }

  return {
    id: String(id),
    title
  };
}

async function fetchLiveMatchesFromApi() {
  const base = normalizeBaseUrl(process.env.CRICKET_API_SERVER);
  if (!base) {
    return [];
  }

  try {
    const response = await axios.get(`${base}/matches`, {
      timeout: API_TIMEOUT
    });

    const payload = response.data;
    const matches = extractMatchesArray(payload)
      .map(normalizeApiMatch)
      .filter(Boolean);

    return matches;
  } catch (error) {
    console.error('Live match API fetch failed:', error?.response?.data || error.message);
    return [];
  }
}

function shouldIncludeScrapedTitle(text) {
  const cleaned = cleanText(text);
  if (!cleaned) {
    return false;
  }

  const lower = cleaned.toLowerCase();
  if (!lower.includes('vs')) {
    return false;
  }

  if (lower.includes('preview') || lower.includes('no result') || lower.includes('abandoned')) {
    return false;
  }

  return isLikelyLiveStatus(cleaned);
}

async function scrapeLiveMatchesFromCricbuzz() {
  try {
    const response = await axios.get(CRICBUZZ_LIVE_URL, {
      timeout: API_TIMEOUT
    });

    const $ = cheerio.load(response.data);
    const matches = new Map();

    $('a[href*="/live-cricket-scores/"]').each((_, element) => {
      const href = $(element).attr('href');
      const text = cleanText($(element).text());
      if (!href || !text) {
        return;
      }

      const cleanedHref = href.split('?')[0];
      const segments = cleanedHref.split('/').filter(Boolean);
      const anchorIndex = segments.indexOf('live-cricket-scores');

      if (anchorIndex === -1 || anchorIndex + 1 >= segments.length) {
        return;
      }

      const matchId = segments[anchorIndex + 1];
      if (!matchId || matches.has(matchId)) {
        return;
      }

      if (!shouldIncludeScrapedTitle(text)) {
        return;
      }

      matches.set(matchId, {
        id: String(matchId),
        title: text
      });
    });

    return Array.from(matches.values());
  } catch (error) {
    console.error('Cricbuzz scraping failed:', error.message || error);
    return [];
  }
}

function buildBatsman(payload, index) {
  const suffixes = ['one', 'two'];
  const suffix = suffixes[index - 1];
  const name =
    cleanText(payload[`batter${suffix}`]) ||
    cleanText(payload[`batsman${suffix}`]) ||
    cleanText(payload[`batsman${index}`]);

  if (!name) {
    return null;
  }

  return {
    name,
    runs:
      cleanText(payload[`batsman${suffix}run`]) ||
      cleanText(payload[`batsman${index}run`]) ||
      cleanText(payload[`batsman${index}Runs`]),
    balls:
      cleanText(payload[`batsman${suffix}ball`]) ||
      cleanText(payload[`batsman${index}ball`]) ||
      cleanText(payload[`batsman${index}Balls`]),
    strikeRate:
      cleanText(payload[`batsman${suffix}sr`]) ||
      cleanText(payload[`batsman${index}sr`]) ||
      cleanText(payload[`batsman${index}SR`])
  };
}

function buildBowler(payload, index) {
  const suffixes = ['one', 'two'];
  const suffix = suffixes[index - 1];
  const name = cleanText(payload[`bowler${suffix}`]) || cleanText(payload[`bowler${index}`]);

  if (!name) {
    return null;
  }

  return {
    name,
    overs:
      cleanText(payload[`bowler${suffix}over`]) ||
      cleanText(payload[`bowler${index}over`]) ||
      cleanText(payload[`bowler${index}Overs`]),
    runs:
      cleanText(payload[`bowler${suffix}run`]) ||
      cleanText(payload[`bowler${index}run`]) ||
      cleanText(payload[`bowler${index}Runs`]),
    wickets:
      cleanText(payload[`bowler${suffix}wickers`]) ||
      cleanText(payload[`bowler${index}wickets`]) ||
      cleanText(payload[`bowler${index}Wickets`]),
    economy:
      cleanText(payload[`bowler${suffix}economy`]) ||
      cleanText(payload[`bowler${index}economy`]) ||
      cleanText(payload[`bowler${index}Economy`])
  };
}

function normalizeScorePayload(matchId, payload, fallbackTitle) {
  const title = cleanText(payload?.title) || cleanText(payload?.matchtitle) || fallbackTitle || `Match ${matchId}`;
  const score = cleanText(payload?.livescore) || cleanText(payload?.score) || 'Live';
  const status = cleanText(payload?.status) || cleanText(payload?.update) || 'Live';
  const update = cleanText(payload?.update) || cleanText(payload?.lastupdate);
  const runrate = cleanText(payload?.runrate) || cleanText(payload?.currentrunrate);

  const batsmen = [buildBatsman(payload, 1), buildBatsman(payload, 2)].filter(Boolean);
  const bowlers = [buildBowler(payload, 1), buildBowler(payload, 2)].filter(Boolean);

  return {
    id: String(matchId),
    title,
    score,
    status,
    update,
    runrate,
    batsmen,
    bowlers,
    extras: cleanText(payload?.extras) || null,
    partnership: cleanText(payload?.partnership) || null,
    lastWicket: cleanText(payload?.lastwicket) || cleanText(payload?.lastWicket) || null,
    recentOvers: cleanText(payload?.recentballs) || cleanText(payload?.recentBalls) || null
  };
}

async function getLiveMatches(_req, res) {
  const apiMatches = await fetchLiveMatchesFromApi();

  if (apiMatches.length) {
    return res.json(apiMatches);
  }

  const scrapedMatches = await scrapeLiveMatchesFromCricbuzz();

  return res.json(scrapedMatches);
}

async function getLiveScore(req, res) {
  const { matchId } = req.params;
  const fallbackTitle = cleanText(req.query?.title);

  if (!matchId) {
    return res.status(400).json({ message: 'Match ID is required.' });
  }

  const base = normalizeBaseUrl(process.env.CRICKET_API_SERVER);

  if (!base) {
    return res.status(503).json({ message: 'Live score API unavailable: CRICKET_API_SERVER not configured.' });
  }

  try {
    const response = await axios.get(`${base}/score`, {
      params: { id: matchId },
      timeout: API_TIMEOUT
    });

    const payload = response.data;

    const hasUsefulData = payload && Object.values(payload).some((value) => cleanText(value));

    if (!hasUsefulData) {
      return res.status(404).json({ message: 'Live score not available for this match.' });
    }

    const normalized = normalizeScorePayload(matchId, payload, fallbackTitle);

    return res.json(normalized);
  } catch (error) {
    console.error(`Error fetching live score for ${matchId}:`, error?.response?.data || error.message);

    const statusCode = error?.response?.status === 404 ? 404 : 502;

    return res.status(statusCode).json({ message: 'Unable to retrieve live score at the moment.' });
  }
}

module.exports = {
  getLiveMatches,
  getLiveScore
};
