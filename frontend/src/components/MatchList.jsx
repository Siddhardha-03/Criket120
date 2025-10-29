import MatchCard from './MatchCard';

function MatchList({ matches }) {
  if (!matches.length) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No matches found.</p>
      </div>
    );
  }

  return (
    <div className="row g-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}

export default MatchList;
