import React, { useEffect, useState } from 'react';
import Search from '../components/Search';
import Settings from '../components/Settings';
import Toast from '../components/Toast';
import { ReactComponent as SettingsIcon } from '../static/settings-icon.svg';
import { ReactComponent as CloseIcon } from '../static/close-icon.svg';
import { ReactComponent as MinimizeIcon } from '../static/minimize-icon.svg';
import { checkBackendHealth } from '../utils/api';
import './App.scss';

interface FileMatch { filename: string, folder: string }
interface EmbedMatch { filename?: string; highlighted?: string; text?: string; score: number }

const App: React.FC = () => {
  const [page, setPage] = useState<'search' | 'settings'>('search');
  const [toast, setToast] = useState('');
  const [preservedQuery, setPreservedQuery] = useState('');
  const [preservedResults, setPreservedResults] = useState<{ fileMatches: FileMatch[]; embedMatches: EmbedMatch[] }>({ fileMatches: [], embedMatches: [] });
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [showReadyMessage, setShowReadyMessage] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const tryCheck = async () => {
      try {
        const res = await checkBackendHealth();
        if (res.status === 200) {
          setBackendReady(true);
          setShowReadyMessage(true);
          setTimeout(() => {
            setShowReadyMessage(false);
            window.electron?.ipcRenderer?.send('app/minimize');
          }, 3000);
        } else {
          throw new Error(`status ${res.status}`);
        }
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
      setTimeout(() => {
        // Let the Search component mount first, then focus input
        const input = document.querySelector<HTMLInputElement>('input.search-input');
        input?.focus();
      }, 50);
    });
  }, []);

  useEffect(() => {
    if (page === 'settings') {
      window.electron?.ipcRenderer?.send('resize-window', 500);
    }
  }, [page]);

  const renderLoader = () => (
    <div className="container">
      <div className="titlebar"><div className="drag-region"/><div className="topbar-buttons-container">
        <button className="minimize-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/minimize')} aria-label="Minimize"><MinimizeIcon/></button>
        <button className="close-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/close')} aria-label="Close"><CloseIcon/></button>
      </div></div>
      <div className="main-content waiting">
        {backendError ? <p><span className="failed-icon"/>Failed to start the backend!</p> : <>
          <p className="shrink-p">Loading....</p>
          <p className="progress"></p>
        </>}
      </div>
    </div>
  );

  const renderReadyMessage = () => (
    <div className="container">
      <div className="titlebar"><div className="drag-region"/><div className="topbar-buttons-container">
        <button className="minimize-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/minimize')} aria-label="Minimize"><MinimizeIcon/></button>
        <button className="close-fab" onClick={() => (window as any).electron?.ipcRenderer.send('app/close')} aria-label="Close"><CloseIcon/></button>
      </div></div>
      <div className="main-content waiting">
        <div className="spinner"/>
        <p className="shrink-p"><strong>SmartSearch is ready! Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> to start searching. </strong></p>&nbsp;&nbsp;
        <p>This dialog will auto close soon!</p>
      </div>
    </div>
  );

  if (!backendReady) return renderLoader();
   if (showReadyMessage) return renderReadyMessage();

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
