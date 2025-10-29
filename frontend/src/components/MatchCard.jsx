import { Link } from 'react-router-dom';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function MatchCard({ match }) {
  return (
    <div className="col-12 col-sm-6 col-lg-4 d-flex">
      <div className="card w-100 shadow-sm card-hover">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">
              {match.team1} <span className="text-muted">vs</span> {match.team2}
            </h5>
            <span className={`badge bg-${getStatusVariant(match.status)} match-status-badge`}>
              {match.status}
            </span>
          </div>
          <p className="text-muted mb-2 small">{formatDate(match.match_date)}</p>
          <p className="mb-2 fw-semibold">Venue: {match.venue}</p>
          {match.status === 'live' || match.status === 'completed' ? (
            <div className="mb-2">
              <div className="d-flex justify-content-between">
                <span className="small text-muted">{match.team1}</span>
                <span className="fw-semibold">{match.score_team1 || '-'}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="small text-muted">{match.team2}</span>
                <span className="fw-semibold">{match.score_team2 || '-'}</span>
              </div>
            </div>
          ) : null}
          {match.status === 'completed' && (
            <div className="border-top pt-2 mt-auto">
              <p className="mb-1 small text-muted">Winner</p>
              <p className="mb-1">{match.winner || 'TBD'}</p>
              <p className="mb-1 small text-muted">Player of the Match</p>
              <p className="mb-0">{match.player_of_match || 'TBD'}</p>
            </div>
          )}
          <Link className="btn btn-outline-primary mt-3" to={`/matches/${match.id}`}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function getStatusVariant(status) {
  if (status === 'live') return 'danger';
  if (status === 'completed') return 'success';
  return 'warning';
}

export default MatchCard;
