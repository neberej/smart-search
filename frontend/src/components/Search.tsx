import React, { useState, useEffect, useRef } from 'react';
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

interface PreservedResults {
  fileMatches: FileMatch[];
  embedMatches: EmbedMatch[];
}

interface SearchProps {
  setToast: (msg: string) => void;
  preservedQuery: string;
  setPreservedQuery: (val: string) => void;
  preservedResults: PreservedResults;
  setPreservedResults: (val: PreservedResults) => void;
}

const Search: React.FC<SearchProps> = ({
  setToast,
  preservedQuery,
  setPreservedQuery,
  preservedResults,
  setPreservedResults
}) => {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearSearch = () => {
    setPreservedQuery('');
    setPreservedResults({ fileMatches: [], embedMatches: [] });
    window.electron?.ipcRenderer?.send('resize-window', 200);
  };

  useEffect(() => {
    inputRef.current?.focus();
    window.electron?.ipcRenderer?.send('resize-window', 800);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSearch = async () => {
    if (!preservedQuery.trim()) return;
    setLoading(true);
    try {
      const res = await runSearch(preservedQuery);
      const fileMatches = res.data.fileMatch || [];
      const embedMatches = res.data.embedMatch || [];
      setPreservedResults({ fileMatches, embedMatches });
      window.electron?.ipcRenderer?.send('resize-window', 800);
    } catch (e: any) {
      setToast('Search failed: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleOpenFolder = async (filePath: any) => {
    try {
      await openFolder(filePath);
    } catch (err: any) {
      setToast('Failed to open folder: ' + (err.message || 'Unknown error'));
    }
  };

  const { fileMatches, embedMatches } = preservedResults;

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          ref={inputRef}
          type="search"
          autoComplete="on"
          className="search-input"
          value={preservedQuery}
          onChange={(e) => setPreservedQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search something..."
          aria-label="Search query"
          disabled={loading}
        />
        {preservedQuery && (
          <button className="clear-button" onClick={clearSearch} aria-label="Clear search">
            ×
          </button>
        )}
        <button
          className="search-button"
          onClick={handleSearch}
          disabled={loading}
          aria-label={loading ? 'Searching' : 'Search'}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {fileMatches.length === 0 && embedMatches.length === 0 && !loading && preservedQuery && (
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

export default Search;
