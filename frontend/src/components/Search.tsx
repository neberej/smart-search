import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { runSearch, openFolder } from '../utils/api';
import './Search.scss';
import { ReactComponent as FolderIcon } from '../static/folder-icon.svg';

interface FileMatch {
  filename: string;
}

interface EmbedMatch {
  filename?: string;
  highlighted?: string;
  text?: string;
  score: number;
}

interface SearchResponse {
  fileMatch: FileMatch[];
  embedMatch: EmbedMatch[];
}

const Search: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
  const [query, setQuery] = useState('');
  const [fileMatches, setFileMatches] = useState<FileMatch[]>([]);
  const [embedMatches, setEmbedMatches] = useState<EmbedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await runSearch(query);
      setFileMatches(res.data.fileMatch || []);
      setEmbedMatches(res.data.embedMatch || []);
    } catch (e: any) {
      setToast('Search failed: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setQuery('');
      setFileMatches([]);
      setEmbedMatches([]);
      setHasSearched(false);
    }
  };

  const handleOpenFolder = async (filePath: string) => {
    try {
      await openFolder(filePath);
    } catch (err: any) {
      setToast('Failed to open folder: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          type="search"
          autoComplete="on"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search something..."
          aria-label="Search query"
          disabled={loading}
        />
        <button
          className="search-button"
          onClick={handleSearch}
          disabled={loading}
          aria-label={loading ? 'Searching' : 'Search'}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {hasSearched && fileMatches.length === 0 && embedMatches.length === 0 && !loading && (
        <div className="no-results">No results found.</div>
      )}
      <div className="results-section">
        <ul className="results-list">
          {fileMatches.map((match, idx) => (
            <li key={`file-${idx}`} className="result-item">
              <div className="result-card">
                <div className="result-header">
                  <div className="result-text">File: {match.filename}</div>
                  <button
                    className="open-folder-btn"
                    title="Open folder"
                    onClick={() => handleOpenFolder(match.filename)}
                    aria-label={`Open folder for ${match.filename}`}
                  >
                    <FolderIcon aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="results-section">
        <ul className="results-list">
          {embedMatches.map((result, idx) => (
            <li key={`embed-${idx}`} className="result-item">
              {result.filename ? (
                <div className="result-card">
                  <div className="result-header">
                    <div
                      className="result-text"
                      dangerouslySetInnerHTML={{
                        __html: result.highlighted?.trim() || result.text || 'No text available',
                      }}
                    />
                    <button
                      className="open-folder-btn"
                      title="Open folder"
                      onClick={() => handleOpenFolder(result.filename)}
                      aria-label={`Open folder for ${result.filename}`}
                    >
                      <FolderIcon aria-hidden="true" />
                    </button>
                  </div>
                  <div className="result-path">File: {result.filename}</div>
                  <div className="result-score">Score: {result.score.toFixed(4)}</div>
                </div>
              ) : (
                <div className="no-matches">No matches!</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

Search.propTypes = {
  setToast: PropTypes.func.isRequired,
};

export default Search;