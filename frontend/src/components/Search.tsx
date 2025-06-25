import React, { useState, useEffect, useRef } from 'react';
import { runSearch, openFolder } from '../utils/api';
import './Search.scss';
import { ReactComponent as FolderIcon } from '../static/folder-icon.svg';

interface FileMatch { filename: string }
interface EmbedMatch { filename?: string; highlighted?: string; text?: string; score: number }
interface PreservedResults { fileMatches: FileMatch[]; embedMatches: EmbedMatch[] }

interface SearchProps {
  setToast: (msg: string) => void;
  preservedQuery: string;
  setPreservedQuery: (val: string) => void;
  preservedResults: PreservedResults;
  setPreservedResults: (val: PreservedResults) => void;
}

const Search: React.FC<SearchProps> = ({
  setToast, preservedQuery, setPreservedQuery, preservedResults, setPreservedResults
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { fileMatches, embedMatches } = preservedResults;
  const allResults = [...fileMatches, ...embedMatches];

  useEffect(() => {
    inputRef.current?.focus();
    const height = allResults.length > 0 ? 500 : 200;
    window.electron?.ipcRenderer?.send('resize-window', height);
  }, [allResults, preservedQuery]);

  // Move focus to the selected LI after render
  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLLIElement>('.result-item');
    const el = items?.[selectedIndex];
    el?.focus();
  }, [selectedIndex, allResults.length]);

  const clearSearch = () => {
    setPreservedQuery('');
    setPreservedResults({ fileMatches: [], embedMatches: [] });
    setSelectedIndex(0);
    inputRef.current?.focus();
    window.electron?.ipcRenderer?.send('resize-window', 200);
  };

  const handleSearch = async () => {
    if (!preservedQuery.trim()) {
      clearSearch();
      return;
    }
    setLoading(true);
    try {
      const res = await runSearch(preservedQuery);
      const fm = res.data.fileMatch || [];
      const em = res.data.embedMatch || [];
      setPreservedResults({ fileMatches: fm, embedMatches: em });
      setSelectedIndex(0);
    } catch (e: any) {
      setToast('Search failed: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const handleOpenFolder = async (filePath: string) => {
    if (!filePath) return;
    try {
      await openFolder(filePath);
    } catch (e: any) {
      setToast('Failed to open folder: ' + (e.message || 'Unknown error'));
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => Math.min(idx + 1, allResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => Math.max(idx - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = allResults[selectedIndex];
      handleOpenFolder((item as FileMatch | EmbedMatch).filename || '');
    }
    if (e.key === 'Escape') clearSearch();
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          ref={inputRef}
          type="text"
          autoComplete="on"
          className="search-input"
          value={preservedQuery}
          onChange={e => setPreservedQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search something..."
          disabled={loading}
        />
        {preservedQuery && (
          <button className="clear-button" onClick={clearSearch}>×</button>
        )}
        <button className="search-button" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {preservedQuery && allResults.length === 0 && !loading && (
        <div className="no-results">No results found.</div>
      )}

      {allResults.length > 0 && (
        <div className="results-section">
          <ul
            className="results-list"
            ref={listRef}
            tabIndex={0}
            onKeyDown={onListKeyDown}
            role="listbox"
            aria-activedescendant={`result-${selectedIndex}`}
          >
            {fileMatches.map((match, idx) => (
              <li
                id={`result-${idx}`}
                key={`file-${idx}`}
                className={`result-item ${selectedIndex === idx ? 'selected' : ''}`}
                tabIndex={selectedIndex === idx ? 0 : -1}
                onClick={() => handleOpenFolder(match.filename)}
              >
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-text">File: {match.filename}</div>
                    <button
                      className="open-folder-btn"
                      title="Open folder"
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenFolder(match.filename);
                      }}
                    >
                      <FolderIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {embedMatches.map((res, idx) => {
              const globalIdx = fileMatches.length + idx;
              return (
                <li
                  id={`result-${globalIdx}`}
                  key={`embed-${idx}`}
                  className={`result-item ${selectedIndex === globalIdx ? 'selected' : ''}`}
                  tabIndex={selectedIndex === globalIdx ? 0 : -1}
                  onClick={() => res.filename && handleOpenFolder(res.filename)}
                >
                  {res.filename ? (
                    <div className="result-card">
                      <div className="result-header">
                        <div
                          className="result-text"
                          dangerouslySetInnerHTML={{
                            __html: res.highlighted?.trim() || res.text || 'No text'
                          }}
                        />
                        <button
                          className="open-folder-btn"
                          title="Open folder"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenFolder(res.filename!);
                          }}
                        >
                          <FolderIcon />
                        </button>
                      </div>
                      <div className="result-path">File: {res.filename}</div>
                      <div className="result-score">Score: {res.score.toFixed(4)}</div>
                    </div>
                  ) : (
                    <div className="no-matches">No matches!</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Search;
