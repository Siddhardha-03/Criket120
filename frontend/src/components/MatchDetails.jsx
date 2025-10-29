function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short'
  });
}

function MatchDetails({ match }) {
  if (!match) {
    return null;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-0">
        <h2 className="h4 mb-0 text-center text-md-start">
          {match.team1} <span className="text-muted">vs</span> {match.team2}
        </h2>
        <p className="text-muted mb-0 mt-2 text-center text-md-start">
          {formatDateTime(match.match_date)} · {match.venue}
        </p>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="border rounded p-3 h-100">
              <h3 className="h5 mb-3">Scores</h3>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="fw-semibold">{match.team1}</span>
                <span className="fs-5">{match.score_team1 || '-'}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <span className="fw-semibold">{match.team2}</span>
                <span className="fs-5">{match.score_team2 || '-'}</span>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="border rounded p-3 h-100">
              <h3 className="h5 mb-3">Match Summary</h3>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Status</span>
                <span className="text-capitalize fw-semibold">{match.status}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Winner</span>
                <span className="fw-semibold">{match.winner || 'TBD'}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Player of the Match</span>
                <span className="fw-semibold text-end">
                  {match.player_of_match || 'TBD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchDetails;
