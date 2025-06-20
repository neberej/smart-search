import React, { useState } from 'react';
import Search from '../components/Search';
import Settings from '../components/Settings';
import Toast from '../components/Toast';
import './App.scss';

const App: React.FC = () => {
  const [tab, setTab] = useState<'search' | 'settings'>('search');
  const [toast, setToast] = useState('');

  return (
    <div className="container">
      <div className="tabs">
        <ul className="tab-list">
          <li className={tab === 'search' ? 'tab active' : 'tab'}>
            <button onClick={() => setTab('search')}>Search</button>
          </li>
          <li className={tab === 'settings' ? 'tab active' : 'tab'}>
            <button onClick={() => setTab('settings')}>Settings</button>
          </li>
        </ul>
      </div>

      <div className="tab-content">
        {tab === 'search' ? <Search setToast={setToast} /> : <Settings setToast={setToast} />}
      </div>
      <Toast message={toast} setToast={setToast} />
    </div>
  );
};

export default App;