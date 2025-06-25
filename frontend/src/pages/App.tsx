import React, { useEffect, useState } from 'react';
import Search from '../components/Search';
import Settings from '../components/Settings';
import Toast from '../components/Toast';
import { ReactComponent as SettingsIcon } from '../static/settings-icon.svg';
import { ReactComponent as CloseIcon } from '../static/close-icon.svg';
import { ReactComponent as MinimizeIcon } from '../static/minimize-icon.svg';
import { checkBackendHealth } from '../utils/api';
import './App.scss';

interface FileMatch { filename: string }
interface EmbedMatch { filename?: string; highlighted?: string; text?: string; score: number }

const App: React.FC = () => {
  const [page, setPage] = useState<'search' | 'settings'>('search');
  const [toast, setToast] = useState('');
  const [preservedQuery, setPreservedQuery] = useState('');
  const [preservedResults, setPreservedResults] = useState<{ fileMatches: FileMatch[]; embedMatches: EmbedMatch[] }>({ fileMatches: [], embedMatches: [] });
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const tryCheck = async () => {
      try {
        const res = await checkBackendHealth();
        if (res.status === 200) setBackendReady(true);
        else throw new Error(`status ${res.status}`);
      } catch {
        attempts++;
        if (attempts >= 10) setBackendError(true);
        else setTimeout(tryCheck, 1000);
      }
    };
    tryCheck();
  }, []);

  useEffect(() => {
    window.electron?.ipcRenderer?.on('reset-search', () => {
      setPreservedQuery('');
      setPreservedResults({ fileMatches: [], embedMatches: [] });
      setPage('search');
    });
  }, []);

  const renderLoader = () => (
    <div className="container">
      <div className="titlebar"><div className="drag-region"/><div className="topbar-buttons-container">
        <button className="minimize-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/minimize')} aria-label="Minimize"><MinimizeIcon/></button>
        <button className="close-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/close')} aria-label="Close"><CloseIcon/></button>
      </div></div>
      <div className="main-content waiting">
        {backendError ? <p>Backend failed to start after 10 attempts.</p> : <>
          <div className="spinner"/>
          <p>Waiting for backend to start...</p>
        </>}
      </div>
    </div>
  );

  if (!backendReady) return renderLoader();

  return (
    <div className="container">
      <div className="titlebar">
        <div className="drag-region"/>
        <div className="topbar-buttons-container">
          <button className="minimize-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/minimize')} aria-label="Minimize"><MinimizeIcon/></button>
          <button className="settings-fab" onClick={() => setPage(p => p==='settings' ? 'search' : 'settings')} aria-label="Settings"><SettingsIcon/></button>
          <button className="close-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/close')} aria-label="Close"><CloseIcon/></button>
        </div>
      </div>
      <div className="main-content">
        {page === 'search' ? (
          <Search setToast={setToast} preservedQuery={preservedQuery} setPreservedQuery={setPreservedQuery}
                  preservedResults={preservedResults} setPreservedResults={setPreservedResults} />
        ) : (
          <Settings setToast={setToast} goBack={() => setPage('search')} />
        )}
      </div>
      <Toast message={toast} setToast={setToast}/>
    </div>
  );
};

export default App;
