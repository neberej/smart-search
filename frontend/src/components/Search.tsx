import React, { useState, useEffect, useRef, useMemo } from 'react';
import { runSearch, openFolder } from '../utils/api';
import './Search.scss';
import { ReactComponent as FolderIcon } from '../static/folder-icon.svg';

interface FileMatch {
  filename: string;
  folder: string;
}
interface EmbedGroup {
  filename: string;
  chunks: EmbedMatch[];
}
interface EmbedMatch {
  filename?: string;
  highlighted?: string;
  text?: string;
  score: number;
  chunk_id?: any
}
interface PreservedResults {
  fileMatches: FileMatch[];
  embedMatches: EmbedMatch[];
}
interface FolderGroup {
  folder: string;
  count: number;
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
  setPreservedResults,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { fileMatches, embedMatches } = preservedResults;

  // Group file matches by folder
  const groupedFileMatches: FolderGroup[] = useMemo(() => {
    const folderMap = new Map<string, number>();
    for (const { folder } of fileMatches) {
      folderMap.set(folder, (folderMap.get(folder) || 0) + 1);
    }
    return Array.from(folderMap.entries()).map(([folder, count]) => ({ folder, count }));
  }, [fileMatches]);

  const groupedEmbedMatches: EmbedGroup[] = useMemo(() => {
    const map = new Map<string, EmbedMatch[]>();
    for (const embed of embedMatches) {
      if (!embed.filename) continue;
      if (!map.has(embed.filename)) {
        map.set(embed.filename, []);
      }
      map.get(embed.filename)!.push(embed);
    }
    return Array.from(map.entries()).map(([filename, chunks]) => ({ filename, chunks }));
  }, [embedMatches]);

  const allResults = useMemo(() => [...groupedFileMatches, ...embedMatches], [groupedFileMatches, embedMatches]);

  const fileNamesDisplayMap = useMemo(() => {
    const map = new Map<string, string>();
    const folderGroups = new Map<string, string[]>();

    for (const { folder, filename } of fileMatches) {
      const name = filename.split('/').pop() || filename;
      if (!folderGroups.has(folder)) folderGroups.set(folder, []);
      folderGroups.get(folder)!.push(name);
    }

    for (const [folder, names] of folderGroups.entries()) {
      if (names.length === 1) {
        map.set(folder, `${names[0]}`);
      } else if (names.length === 2) {
        map.set(folder, `${names[0]} and 1 more file`);
      } else {
        map.set(folder, `${names[0]} and ${names.length - 1} more files`);
      }
    }

    return map;
  }, [fileMatches]);

  const getFileNamesDisplay = (folder: string) => fileNamesDisplayMap.get(folder) || '';

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
    if (el && !el.classList.contains('in-view')) {
      el.scrollIntoView({ block: 'nearest' });
    }
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
          if ('folder' in item) {
            handleOpenFolder(item.folder);
          } else if ('filename' in item && item.filename) {
            handleOpenFolder(item.filename);
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
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
    const rawInput = inputRef.current?.value ?? preservedQuery ?? '';
    const trimmed = rawInput.trim();
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
      inputRef.current?.blur(); // let arrow keys work
    } catch (e: any) {
      setToast('Search failed: ' + (e.message || 'Unknown error'));
    }

    setLoading(false);
  };

  const handleOpenFolder = async (filePath: string) => {
    if (!filePath) return;
    try {
      console.log(filePath)
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
        {preservedQuery && (
          <button className="clear-button" onClick={clearSearch}>
            ×
          </button>
        )}
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
            {groupedFileMatches.map((m, i) => (
              <li
                key={`folder-${m.folder}-${m.count}`}
                className={`result-item ${selectedIndex === i ? 'selected' : ''}`}
                tabIndex={-1}
                onClick={() => handleOpenFolder(m.folder)}
              >
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-text">
                      Folder: {m.folder} ({getFileNamesDisplay(m.folder)})
                    </div>
                    <button
                      className="open-folder-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFolder(m.folder);
                      }}
                    >
                      <FolderIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          {groupedEmbedMatches.map(({ filename, chunks }, idx) => {
            const baseIndex = groupedFileMatches.length + idx;
            // Pick first chunk (or best scoring chunk)
            const firstChunk = chunks[0];

            return (
              <li
                key={`embed-group-${filename}`}
                className={`result-item ${selectedIndex === baseIndex ? 'selected' : ''}`}
                tabIndex={-1}
                onClick={() => handleOpenFolder(filename)}
              >
                <div className="result-card">
                  <div className="result-header">
                    <div className="result-text">
                      File: {filename} ({chunks.length} chunk{chunks.length > 1 ? 's' : ''})
                    </div>
                    <button
                      className="open-folder-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFolder(filename);
                      }}
                    >
                      <FolderIcon />
                    </button>
                  </div>

                  <div
                    className="result-snippet"
                    dangerouslySetInnerHTML={{
                      __html: firstChunk.highlighted?.trim() || firstChunk.text || 'No text',
                    }}
                  />
                  {/* <div className="result-score">Score: {firstChunk.score.toFixed(4)}</div> */}
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
