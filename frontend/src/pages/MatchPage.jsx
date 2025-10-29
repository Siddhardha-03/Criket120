import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MatchDetails from '../components/MatchDetails';
import { fetchMatchById } from '../api/api';

function MatchPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMatch() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchMatchById(id);
        setMatch(data);
      } catch (err) {
        console.error('Failed to load match', err);
        setError('Unable to load match details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [id]);

  return (
    <div className="container">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="display-6 fw-semibold mb-0">Match Details</h1>
          <p className="text-muted mb-0">Comprehensive view of the match highlights.</p>
        </div>
        <Link className="btn btn-outline-primary" to="/">
          ← Back to Matches
        </Link>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && !match && (
        <div className="alert alert-warning" role="alert">
          Match not found.
        </div>
      )}

      {!loading && !error && match && <MatchDetails match={match} />}
    </div>
  );
}

export default MatchPage;
