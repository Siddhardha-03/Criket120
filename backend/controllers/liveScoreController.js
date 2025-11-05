const axios = require('axios');
const cheerio = require('cheerio');

const CRICBUZZ_LIVE_URL = 'https://www.cricbuzz.com/cricket-match/live-scores';
const RAPID_API_DEFAULT_BASE = 'https://free-cricbuzz-cricket-api.p.rapidapi.com';
const RAPID_API_DEFAULT_HOST = 'free-cricbuzz-cricket-api.p.rapidapi.com';
const CRICAPI_DEFAULT_BASE = 'https://api.cricapi.com/v1';

const LIVE_MATCHES_ENDPOINT = '/cricket-matches-live';
const SCORECARD_ENDPOINT = '/cricket-match-scorecard';
const MATCH_INFO_ENDPOINT = '/cricket-match-info';
const CRICAPI_LIVE_MATCHES_ENDPOINT = '/currentMatches';
const CRICAPI_SCORE_ENDPOINT = '/cricScore';

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
  if (['data not found', 'na', 'null', 'none', 'n/a'].includes(lowered)) {
    return null;
  }

  return str;
}

function resolveRapidApiConfig() {
  const baseUrl = normalizeBaseUrl(process.env.CRICBUZZ_API_BASE_URL || process.env.CRICKET_API_SERVER || RAPID_API_DEFAULT_BASE);

  return {
    baseUrl,
    host: cleanText(process.env.CRICBUZZ_API_HOST) || RAPID_API_DEFAULT_HOST,
    key: cleanText(process.env.CRICBUZZ_API_KEY)
  };
}

function hasRapidApiCredentials(config) {
  return Boolean(config.baseUrl && config.key && config.host);
}

function resolveCricApiConfig() {
  const baseUrl = normalizeBaseUrl(process.env.CRICAPI_BASE_URL || CRICAPI_DEFAULT_BASE);

  return {
    baseUrl,
    key: cleanText(process.env.CRICAPI_API_KEY || process.env.CRICAPI_KEY || process.env.CRICAPI_APikey || process.env.CRIC_SCORE_API_KEY)
  };
}

function hasCricApiCredentials(config) {
  return Boolean(config.baseUrl && config.key);
}

async function fetchFromRapidApi(path, params = {}) {
  const config = resolveRapidApiConfig();

  if (!hasRapidApiCredentials(config)) {
    return null;
  }

  try {
    const response = await axios.get(`${config.baseUrl}${path}`, {
      params,
      timeout: API_TIMEOUT,
      headers: {
        'x-rapidapi-key': config.key,
        'x-rapidapi-host': config.host
      }
    });

    return response.data;
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error(`RapidAPI request failed [${path}]:`, error?.response?.data || error.message);
    }
    throw error;
  }
}

function getValueByKeys(object, keys = []) {
  for (const key of keys) {
    const value = object?.[key];
    const cleaned = cleanText(value);
    if (cleaned) {
      return cleaned;
    }
  }
  return null;
}

function isLikelyLiveStatus(status) {
  const cleaned = cleanText(status);
  if (!cleaned) {
    return false;
  }

  const lower = cleaned.toLowerCase();
  const keywords = ['live', 'need', 'trail', 'lead', 'stumps', 'session', 'day', 'overs', 'progress', 'drinks', 'innings', 'target'];

  return keywords.some((keyword) => lower.includes(keyword));
}

function extractMatchesArray(payload) {
  if (!payload) {
    return [];
  }

  if (payload.status === 'success' && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && Array.isArray(payload.data.matches)) {
    return payload.data.matches;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.response)) {
    return payload.response;
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

  return [];
}

function toLiveMatchEntry(match) {
  if (!match || typeof match !== 'object') {
    return null;
  }

  const id = cleanText(
    match.matchId ||
      match.match_id ||
      match.matchid ||
      match.id ||
      match.matchInfo?.matchId ||
      match.matchHeader?.matchId
  );

  if (!id) {
    return null;
  }

  const titleCandidates = [
    match.title,
    match.matchDesc,
    match.matchDescription,
    match.shortTitle,
    match.seriesName && match.matchDesc ? `${match.seriesName}: ${match.matchDesc}` : null,
    match.matchHeader?.matchDescription,
    match.matchInfo?.matchDescription,
    match.team1?.teamName && match.team2?.teamName ? `${match.team1.teamName} vs ${match.team2.teamName}` : null,
    match.matchInfo?.team1?.teamName && match.matchInfo?.team2?.teamName
      ? `${match.matchInfo.team1.teamName} vs ${match.matchInfo.team2.teamName}`
      : null
  ];

  const title = titleCandidates.map(cleanText).find(Boolean) || `Match ${id}`;

  const statusCandidates = [
    match.state,
    match.matchState,
    match.status,
    match.matchInfo?.status,
    match.matchHeader?.status
  ].map(cleanText);

  const isLive =
    typeof match.isLive === 'boolean'
      ? match.isLive
      : typeof match.matchInfo?.isLive === 'boolean'
        ? match.matchInfo.isLive
        : statusCandidates.some(isLikelyLiveStatus);

  if (!isLive) {
    return null;
  }

  return {
    id: String(id),
    title
  };
}

async function fetchLiveMatchesFromRapidApi() {
  try {
    const data = await fetchFromRapidApi(LIVE_MATCHES_ENDPOINT);
    if (!data) {
      return [];
    }

    return extractMatchesArray(data).map(toLiveMatchEntry).filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function fetchFromCricApi(path, params = {}) {
  const config = resolveCricApiConfig();

  if (!hasCricApiCredentials(config)) {
    return null;
  }

  try {
    const response = await axios.get(`${config.baseUrl}${path}`, {
      params: {
        apikey: config.key,
        ...params
      },
      timeout: API_TIMEOUT
    });

    return response.data;
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error(`CricAPI request failed [${path}]:`, error?.response?.data || error.message);
    }
    throw error;
  }
}

function toLiveMatchEntryFromCricApi(match) {
  if (!match || typeof match !== 'object') {
    return null;
  }

  const id = cleanText(
    match.id ||
      match.matchId ||
      match.unique_id ||
      match.uniqueId ||
      match.matchid ||
      (Array.isArray(match.matchInfo) ? match.matchInfo.find((item) => cleanText(item?.id))?.id : null)
  );

  if (!id) {
    return null;
  }

  const teams = Array.isArray(match.teams) ? match.teams.filter(Boolean).map(cleanText).filter(Boolean) : [];
  const titleCandidates = [
    match.name,
    match.matchDesc,
    match.matchDescription,
    teams.length === 2 ? `${teams[0]} vs ${teams[1]}` : null,
    match.status
  ];

  const title = titleCandidates.map(cleanText).find(Boolean) || `Match ${id}`;

  const statusCandidates = [match.status, match.statusText, match.inningsRequirement].map(cleanText).filter(Boolean);
  const isLive = statusCandidates.some(isLikelyLiveStatus) || cleanText(match.matchStarted) === 'true';

  if (!isLive) {
    return null;
  }

  return {
    id: String(id),
    title
  };
}

async function fetchLiveMatchesFromCricApi() {
  try {
    const payload = await fetchFromCricApi(CRICAPI_LIVE_MATCHES_ENDPOINT);
    const matchesArray = extractMatchesArray(payload) || payload?.data || [];
    if (!Array.isArray(matchesArray)) {
      return [];
    }

    return matchesArray.map(toLiveMatchEntryFromCricApi).filter(Boolean);
  } catch (error) {
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
    const response = await axios.get(CRICBUZZ_LIVE_URL, { timeout: API_TIMEOUT });
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
    console.error('Cricbuzz scraping failed:', error?.message || error);
    return [];
  }
}

function flattenScorecards(scorePayload) {
  if (!scorePayload) {
    return [];
  }

  const response = scorePayload.response || scorePayload.data || scorePayload;
  const scorecard = response?.scorecard || response?.scorecards || response?.innings || [];

  if (Array.isArray(scorecard)) {
    return scorecard;
  }

  return [];
}

function buildScoreLine(entry) {
  const teamName =
    cleanText(entry?.batTeamName) ||
    cleanText(entry?.batTeam?.teamName) ||
    cleanText(entry?.teamName) ||
    cleanText(entry?.inningsName) ||
    cleanText(entry?.shortName);

  const runs = entry?.score || entry?.runs || entry?.batScore;
  const wickets = entry?.wickets ?? entry?.wkts;
  const overs = entry?.overs ?? entry?.ovr;

  if (!teamName && !runs && !wickets && !overs) {
    return null;
  }

  let scoreSegment = cleanText(runs);
  if (!scoreSegment && (wickets !== undefined || overs !== undefined)) {
    const wicketsSegment = wickets !== undefined ? wickets : '-';
    const oversSegment = overs !== undefined ? ` (${overs})` : '';
    scoreSegment = `${runs ?? '-'} / ${wicketsSegment}${oversSegment}`;
  } else if (scoreSegment && (wickets !== undefined || overs !== undefined)) {
    const wicketsSegment = wickets !== undefined ? `/${wickets}` : '';
    const oversSegment = overs !== undefined ? ` (${overs})` : '';
    scoreSegment = `${scoreSegment}${wicketsSegment}${oversSegment}`;
  }

  const label = teamName || cleanText(entry?.batTeam?.shortName) || cleanText(entry?.inningsId) || 'Team';

  return {
    label,
    value: scoreSegment || ''
  };
}

function extractBatsmen(scorecards) {
  const batters = [];

  scorecards.forEach((card) => {
    const battersArray = card?.batsman || card?.batsmen || card?.scorecardBatsmen || [];
    if (!Array.isArray(battersArray)) {
      return;
    }

    battersArray.forEach((batter) => {
      const name = cleanText(batter?.name) || cleanText(batter?.batsmanName) || cleanText(batter?.striker);
      if (!name) {
        return;
      }

      batters.push({
        name,
        runs: cleanText(batter?.runs) || cleanText(batter?.r) || cleanText(batter?.score),
        balls: cleanText(batter?.balls) || cleanText(batter?.b),
        strikeRate: cleanText(batter?.strikeRate) || cleanText(batter?.sr)
      });
    });
  });

  return batters.slice(0, 4);
}

function extractBowlers(scorecards) {
  const bowlers = [];

  scorecards.forEach((card) => {
    const bowlersArray = card?.bowlers || card?.scorecardBowlers || [];
    if (!Array.isArray(bowlersArray)) {
      return;
    }

    bowlersArray.forEach((bowler) => {
      const name = cleanText(bowler?.name) || cleanText(bowler?.bowlerName);
      if (!name) {
        return;
      }

      bowlers.push({
        name,
        overs: cleanText(bowler?.overs) || cleanText(bowler?.ov),
        runs: cleanText(bowler?.runs) || cleanText(bowler?.r),
        wickets: cleanText(bowler?.wickets) || cleanText(bowler?.wkts),
        economy: cleanText(bowler?.economy) || cleanText(bowler?.eco)
      });
    });
  });

  return bowlers.slice(0, 4);
}

function normalizeScoreDetails(matchId, infoPayload, scorePayload, fallbackTitle) {
  const info = infoPayload?.response || infoPayload || {};
  const score = scorePayload?.response || scorePayload || {};

  const header = info.matchInfo || score.matchHeader || {};
  const status = cleanText(score.status) || cleanText(header.status) || cleanText(info.status);
  const update = cleanText(score.lastUpdate) || cleanText(score.updated) || cleanText(info.lastUpdate);

  const titleCandidates = [
    cleanText(header.matchDescription),
    cleanText(header.shortTitle),
    cleanText(header.matchDesc),
    cleanText(score.matchDescription),
    cleanText(info.matchDesc),
    fallbackTitle
  ];

  const title = titleCandidates.find(Boolean) || `Match ${matchId}`;

  const scorecards = flattenScorecards(scorePayload);
  const scoreLines = scorecards.map(buildScoreLine).filter(Boolean);

  const combinedScore = scoreLines.length
    ? scoreLines
    : [
        {
          label: cleanText(score.scoreSummaryLabel) || cleanText(score.scoreLabel) || 'Score',
          value: cleanText(score.scoreSummary) || cleanText(score.score)
        }
      ].filter((entry) => entry.value);

  const runrate =
    cleanText(score.currentRunRate) ||
    cleanText(score.runRate) ||
    cleanText(scorecards[0]?.currentRunRate) ||
    cleanText(scorecards[0]?.runRate);

  const batsmen = extractBatsmen(scorecards);
  const bowlers = extractBowlers(scorecards);

  const partnership = cleanText(score.partnership) || cleanText(scorecards[0]?.partnership);
  const extras = cleanText(score.extras) || cleanText(scorecards[0]?.extras);
  const lastWicket = cleanText(score.lastWicket) || cleanText(scorecards[0]?.lastWicket);
  const recentOvers =
    cleanText(score.recentOvers) ||
    cleanText(score.recentBalls) ||
    cleanText(scorecards[0]?.recentOvers) ||
    cleanText(scorecards[0]?.recentBalls);

  return {
    id: String(matchId),
    title,
    status: status || 'Live',
    update: update || null,
    runrate: runrate || null,
    scoreLines: combinedScore,
    score:
      combinedScore && combinedScore.length
        ? combinedScore.map((entry) => `${entry.label}${entry.value ? ` ${entry.value}` : ''}`).join(' | ')
        : cleanText(score.score) || 'Live',
    batsmen,
    bowlers,
    partnership: partnership || null,
    extras: extras || null,
    lastWicket: lastWicket || null,
    recentOvers: recentOvers || null
  };
}

async function fetchMatchInfo(matchId) {
  const params = { matchId };
  try {
    return await fetchFromRapidApi(MATCH_INFO_ENDPOINT, params);
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        return await fetchFromRapidApi(MATCH_INFO_ENDPOINT, { matchid: matchId });
      } catch (innerError) {
        return null;
      }
    }
    return null;
  }
}

async function fetchMatchScorecard(matchId) {
  const params = { matchId };
  try {
    return await fetchFromRapidApi(SCORECARD_ENDPOINT, params);
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        return await fetchFromRapidApi(SCORECARD_ENDPOINT, { matchid: matchId });
      } catch (innerError) {
        return null;
      }
    }
    return null;
  }
}

async function fetchLiveMatches() {
  const cricApiMatches = await fetchLiveMatchesFromCricApi();
  if (cricApiMatches.length) {
    return cricApiMatches;
  }

  const rapidMatches = await fetchLiveMatchesFromRapidApi();
  if (rapidMatches.length) {
    return rapidMatches;
  }

  return scrapeLiveMatchesFromCricbuzz();
}

async function getLiveMatches(_req, res) {
  try {
    const matches = await fetchLiveMatches();
    return res.json(matches);
  } catch (error) {
    console.error('Error fetching live matches:', error?.response?.data || error.message || error);
    return res.status(502).json({ message: 'Unable to retrieve live matches at the moment.' });
  }
}

async function getLiveScore(req, res) {
  const { matchId } = req.params;
  const fallbackTitle = cleanText(req.query?.title);

  if (!matchId) {
    return res.status(400).json({ message: 'Match ID is required.' });
  }

  const cricApiConfig = resolveCricApiConfig();
  if (hasCricApiCredentials(cricApiConfig)) {
    try {
      const cricApiScore = await fetchCricApiScore(matchId);
      const normalizedCricScore = normalizeCricApiScore(matchId, cricApiScore, fallbackTitle);
      if (normalizedCricScore) {
        return res.json(normalizedCricScore);
      }
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error(`CricAPI score fetch failed for ${matchId}:`, error?.response?.data || error.message);
      }
    }
  }

  const config = resolveRapidApiConfig();
  if (!hasRapidApiCredentials(config)) {
    return res.status(503).json({ message: 'Live score API unavailable: CRICBUZZ_API_KEY or base URL not configured.' });
  }

  try {
    const [infoPayload, scorePayload] = await Promise.all([fetchMatchInfo(matchId), fetchMatchScorecard(matchId)]);

    if (!scorePayload && !infoPayload) {
      return res.status(404).json({ message: 'Live score not available for this match.' });
    }

    const normalized = normalizeScoreDetails(matchId, infoPayload, scorePayload, fallbackTitle);

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
