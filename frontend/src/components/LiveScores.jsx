import { useEffect, useMemo, useState } from 'react';
import { fetchLiveMatches, fetchLiveScore } from '../api/api';

const REFRESH_INTERVAL = 30000; // 30 seconds
const SCORE_SEGMENT_REGEX = /\s*(?:\r?\n|\\n|•|\||;)+\s*/;

function sanitizeSegment(value) {
  if (!value) {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

function cleanScoreLabel(label) {
  const cleaned = sanitizeSegment(label);
  if (!cleaned) {
    return '';
  }

  return cleaned.replace(/\s+score$/i, '').trim() || cleaned;
}

function cleanScoreValue(value) {
  const cleaned = sanitizeSegment(value);
  if (!cleaned) {
    return '';
  }

  return cleaned.replace(/^[:\-\s]+/, '');
}

function extractTeamScoreLines(scoreText, title) {
  if (!scoreText) {
    return [];
  }

  const normalized = scoreText.replace(/\\n/g, '\n');
  let parts = normalized
    .split(SCORE_SEGMENT_REGEX)
    .map(sanitizeSegment)
    .filter(Boolean);

  if (parts.length <= 1) {
    const vsSplit = normalized.split(/\s+v(?:s\.?|\/s)\s+/i).map(sanitizeSegment).filter(Boolean);
    if (vsSplit.length > 1) {
      parts = vsSplit;
    }
  }

  if (parts.length <= 1 && title && /\bvs\b|v\/s|v\.s\./i.test(title)) {
    const teams = title.split(/\bvs\b|v\/s|v\.s\./i).map(sanitizeSegment).filter(Boolean);
    if (teams.length === 2) {
      const combined = parts[0] || '';
      if (combined) {
        const teamScores = teams.map((teamName) => {
          const pattern = new RegExp(`${teamName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[^A-Za-z]*`, 'i');
          const match = combined.match(pattern);
          return match ? sanitizeSegment(match[0]) : '';
        }).filter(Boolean);

        if (teamScores.length === 2) {
          parts = teamScores;
        }
      }
    }
  }

  return parts;
}

function scoreLineToEntry(line) {
  const cleaned = sanitizeSegment(line);
  if (!cleaned) {
    return null;
  }

  const numericIndex = cleaned.search(/\d/);

  if (numericIndex > 0) {
    return {
      label: cleaned.slice(0, numericIndex).trim(),
      value: cleaned.slice(numericIndex).trim()
    };
  }

  const colonIndex = cleaned.indexOf(':');
  if (colonIndex !== -1) {
    return {
      label: cleaned.slice(0, colonIndex).trim(),
      value: cleaned.slice(colonIndex + 1).trim()
    };
  }

  return {
    label: cleaned,
    value: ''
  };
}

function LiveScores() {
  const [matchCards, setMatchCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const isEmpty = useMemo(() => !matchCards.length, [matchCards]);

  useEffect(() => {
    let intervalId;
    let isMounted = true;

    async function loadScores() {
      try {
        if (isMounted) {
          setError('');
        }

        const liveMatches = await fetchLiveMatches();
        const matchesArray = Array.isArray(liveMatches) ? liveMatches.slice(0, 5) : [];

        if (!matchesArray.length) {
          if (isMounted) {
            setMatchCards([]);
            setLastUpdated(new Date());
          }
          return;
        }

        const scorePromises = matchesArray.map(async (match) => {
          try {
            const details = await fetchLiveScore(match.id, {
              params: { title: match.title }
            });

            return {
              id: match.id,
              title: match.title,
              details,
              error: ''
            };
          } catch (scoreError) {
            console.error(`Failed to fetch live score for ${match.id}`, scoreError);
            return {
              id: match.id,
              title: match.title,
              details: null,
              error: 'Score unavailable at the moment.'
            };
          }
        });

        const results = await Promise.all(scorePromises);

        if (isMounted) {
          setMatchCards(results);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch live matches', err);
        if (isMounted) {
          setError('Unable to fetch live matches right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadScores();
    intervalId = setInterval(loadScores, REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="alert alert-info" role="alert">
        No live matches right now. Check upcoming matches.
      </div>
    );
  }

  return (
    <>
      {lastUpdated && (
        <p className="text-muted small mb-1">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
      <p className="text-muted small mb-3">Showing up to 5 live matches.</p>
      <div className="row g-3">
        {matchCards.map((card) => (
          <div key={card.id} className="col-12 col-md-6 col-xl-4 d-flex">
            <div className="card w-100 border-danger shadow-sm card-hover">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h3 className="h5 text-danger mb-1 text-uppercase">Live</h3>
                    <h4 className="h5 text-lg mb-0 text-wrap">{card.title}</h4>
                  </div>
                  <span className="badge bg-danger align-self-start">Live</span>
                </div>

                {card.error && (
                  <div className="alert alert-warning mt-3 mb-0" role="alert">
                    {card.error}
                  </div>
                )}

                {!card.error && card.details && (
                  <>
                    <p className="text-muted small mb-2">
                      {card.details.status || 'Live'}
                      {card.details.update ? ` · ${card.details.update}` : ''}
                    </p>

                    <div className="border rounded-3 p-3 mb-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold text-md">Score</span>
                        {card.details.runrate && (
                          <span className="badge bg-light text-dark border">RR {card.details.runrate}</span>
                        )}
                      </div>
                      {(() => {
                        const structuredLines = Array.isArray(card.details?.scoreLines)
                          ? card.details.scoreLines
                              .map((entry) => {
                                if (!entry) return null;
                                if (typeof entry === 'string') {
                                  return scoreLineToEntry(entry);
                                }
                                const label = cleanScoreLabel(entry.label || entry.team || entry.name || entry.title);
                                const value = cleanScoreValue(entry.value || entry.score || entry.run || entry.text);
                                if (!label && !value) {
                                  return null;
                                }
                                return {
                                  label: label || 'Score',
                                  value: value || ''
                                };
                              })
                              .filter(Boolean)
                          : [];

                        const fallbackLines = extractTeamScoreLines(card.details.score, card.title)
                          .map(scoreLineToEntry)
                          .filter(Boolean);

                        const displayLines = structuredLines.length ? structuredLines : fallbackLines;

                        if (displayLines.length) {
                          return (
                            <ul className="list-unstyled mb-0">
                              {displayLines.map((entry, index) => (
                                <li key={`${card.id}-score-${index}`} className="d-flex justify-content-between align-items-center text-sm py-1 border-bottom">
                                  <span className="fw-semibold text-wrap me-2">{entry.label}</span>
                                  <span className="fw-bold text-danger text-end">{entry.value || '—'}</span>
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        return (
                          <p className="fw-bold fs-4 text-danger mb-0">{card.details.score || '—'}</p>
                        );
                      })()}
                    </div>

                    {!!card.details.batsmen?.length && (
                      <div className="mb-3">
                        <h5 className="h6 text-uppercase text-muted mb-2">Batsmen</h5>
                        <ul className="list-unstyled mb-0">
                          {card.details.batsmen.map((batter, index) => (
                            <li key={`${card.id}-batter-${index}`} className="d-flex justify-content-between text-sm border-bottom py-2">
                              <span className="fw-semibold text-wrap">
                                {batter.name}
                              </span>
                              <span>
                                {batter.runs || '0'} ({batter.balls || '0'})
                                {batter.strikeRate ? ` · SR ${batter.strikeRate}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!!card.details.bowlers?.length && (
                      <div className="mb-3">
                        <h5 className="h6 text-uppercase text-muted mb-2">Bowlers</h5>
                        <ul className="list-unstyled mb-0">
                          {card.details.bowlers.map((bowler, index) => (
                            <li key={`${card.id}-bowler-${index}`} className="d-flex justify-content-between text-sm border-bottom py-2">
                              <span className="fw-semibold text-wrap">{bowler.name}</span>
                              <span>
                                {bowler.overs || '-'} overs · {bowler.runs || '-'} / {bowler.wickets || '-'}
                                {bowler.economy ? ` · ECO ${bowler.economy}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {card.details.recentOvers && (
                      <p className="text-muted text-sm mb-1">Recent: {card.details.recentOvers}</p>
                    )}
                    {card.details.partnership && (
                      <p className="text-muted text-sm mb-0">Partnership: {card.details.partnership}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default LiveScores;
