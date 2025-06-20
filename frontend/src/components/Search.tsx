import React, { useState } from 'react';
import { runSearch } from '../utils/api';

const Search: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await runSearch(query);
      setResults(res.data.results);
    } catch (e: any) {
      setToast('Search failed: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search something..."
      />
      <button className="button" onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      <ul>
        {results.map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
