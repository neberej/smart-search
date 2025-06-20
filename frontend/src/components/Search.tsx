import React, { useState } from 'react';
import { runSearch } from '../utils/api';
import './Search.scss';

const Search: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
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
    <div className="search-container">
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
          <li key={idx}>
            {r.filename ? <div>
              <h4>Path: {r.filename}</h4>
              <div className="matched-text">
                <strong>Text:</strong>
                <div
                  dangerouslySetInnerHTML={{
                    __html: typeof r.highlighted === 'string' && r.highlighted.trim()
                      ? r.highlighted
                      : r.text || '',
                  }}
                />
              </div>
              <div>Score: {r.score.toFixed(4)}</div>
            </div>
            : 
            <div>No matches!</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
