import { useEffect, useMemo, useState } from 'react';
import MatchList from '../components/MatchList';
import { fetchMatches } from '../api/api';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Live', value: 'live' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' }
];

function HomePage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        setError('');
        const status = statusFilter === 'all' ? undefined : statusFilter;
        const data = await fetchMatches(status);
        setMatches(data);
      } catch (err) {
        console.error('Failed to load matches', err);
        setError('Unable to load matches. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [statusFilter]);

  const filteredMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return matches;
    }

    return matches.filter((match) => {
      const team1 = match.team1?.toLowerCase() || '';
      const team2 = match.team2?.toLowerCase() || '';
      const venue = match.venue?.toLowerCase() || '';
      return (
        team1.includes(term) || team2.includes(term) || venue.includes(term)
      );
    });
  }, [matches, searchTerm]);

  return (
    <div className="container">
      <div className="row justify-content-between align-items-center gy-3">
        <div className="col-12 col-md-6">
          <h1 className="display-6 fw-semibold">Cricket Matches</h1>
          <p className="text-muted mb-0">
            Stay on top of live action, upcoming fixtures, and completed match highlights.
          </p>
        </div>
        <div className="col-12 col-md-6">
          <div className="input-group input-group-lg">
            <span className="input-group-text bg-white fw-semibold">🔍</span>
            <input
              type="search"
              className="form-control"
              placeholder="Search by team or venue"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="d-flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`btn btn-${
                statusFilter === filter.value ? 'primary' : 'outline-primary'
              } btn-rounded`}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4">
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

        {!loading && !error && (
          <MatchList matches={filteredMatches} />
        )}
      </section>
    </div>
  );
}

export default HomePage;
