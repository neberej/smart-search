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
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { fileMatches, embedMatches } = preservedResults;
  const allResults = [...fileMatches, ...embedMatches];

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
    window.electron?.ipcRenderer?.send('resize-window', 165);
  }, []);

  // Resize on results update
  useEffect(() => {
    const height = allResults.length > 0 ? 500 : 165;
    window.electron?.ipcRenderer?.send('resize-window', height);
  }, [allResults.length]);

  // Scroll selected result into view
  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLLIElement>('.result-item');
    const el = items?.[selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement === inputRef.current;

      if (e.key === 'Tab') return;

      if (e.key === 'Backspace') {
        if (!isInputFocused) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isInputFocused) {
          handleSearch();
        } else {
          const item = allResults[selectedIndex];
          if (item?.filename) handleOpenFolder(item.filename);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }

      if (e.key === 'Escape') {
        window.electron?.ipcRenderer?.send('app/minimize');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allResults, selectedIndex]);

  const clearSearch = () => {
    setPreservedQuery('');
    setPreservedResults({ fileMatches: [], embedMatches: [] });
    setHasSearched(false);
    setSelectedIndex(0);
    inputRef.current?.focus();
    window.electron?.ipcRenderer?.send('resize-window', 165);
  };

  const handleSearch = async () => {
    const trimmed = preservedQuery.trim();
    if (!trimmed) {
      clearSearch();
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await runSearch(trimmed);
      setPreservedResults({
        fileMatches: res.data.fileMatch || [],
        embedMatches: res.data.embedMatch || [],
      });
      setSelectedIndex(0);

      // Blur input after search so arrow keys work + prevent Enter glitch
      inputRef.current?.blur();
    } catch (e: any) {
      setToast('Search failed: ' + (e.message || 'Unknown error'));
    }

    setLoading(false);
  };

  const handleOpenFolder = async (filePath: string) => {
    if (!filePath) return;
    try {
      await openFolder(filePath);
      window.electron?.ipcRenderer?.send('app/minimize');
    } catch (e: any) {
      setToast('Failed: ' + e.message);
    }
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          ref={inputRef}
          type="text"
          value={preservedQuery}
          onChange={(e) => {
            setPreservedQuery(e.target.value);
            setHasSearched(false); // Prevent “no results” on hide/show
          }}
          placeholder="Search something..."
          className="search-input"
          disabled={loading}
        />
        {preservedQuery && <button className="clear-button" onClick={clearSearch}>×</button>}
        <button className="search-button" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {hasSearched && preservedQuery.trim() && allResults.length === 0 && !loading && (
        <div className="no-results">No results found.</div>
      )}

      {allResults.length > 0 && (
        <div className="results-section">
          <ul ref={listRef} className="results-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {fileMatches.map((m, i) => (
              <li
                key={i}
                className={`result-item ${selectedIndex === i ? 'selected' : ''}`}
                tabIndex={-1}
                onClick={() => handleOpenFolder(m.filename)}
              >
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-text">File: {m.filename}</div>
                    <button
                      className="open-folder-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFolder(m.filename);
                      }}
                    >
                      <FolderIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {embedMatches.map((r, idx) => {
              const gi = fileMatches.length + idx;
              return (
                <li
                  key={gi}
                  className={`result-item ${selectedIndex === gi ? 'selected' : ''}`}
                  tabIndex={-1}
                  onClick={() => r.filename && handleOpenFolder(r.filename)}
                >
                  <div className="result-card">
                    <div className="result-header">
                      <div
                        className="result-text"
                        dangerouslySetInnerHTML={{
                          __html: r.highlighted?.trim() || r.text || 'No text',
                        }}
                      />
                      <button
                        className="open-folder-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          r.filename && handleOpenFolder(r.filename);
                        }}
                      >
                        <FolderIcon />
                      </button>
                    </div>
                    <div className="result-path">File: {r.filename}</div>
                    <div className="result-score">Score: {r.score.toFixed(4)}</div>
                  </div>
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
