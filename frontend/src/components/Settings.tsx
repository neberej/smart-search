import React, { useEffect, useState } from 'react';
import { getConfig, updateConfig, runReindex } from '../utils/api';

const Settings: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
  const [configText, setConfigText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConfig().then((res) => setConfigText(JSON.stringify(res.data, null, 2)));
  }, []);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(configText);
      await updateConfig(parsed);
      setToast('Config saved.');
    } catch (e: any) {
      setToast('Failed to save: ' + e.message);
    }
  };

  const handleReindex = async () => {
    setLoading(true);
    try {
      await runReindex();
      setToast('Indexing done.');
    } catch (e: any) {
      setToast('Indexing failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Update config:</h3>
      <textarea
        rows={20}
        style={{ width: '100%' }}
        value={configText}
        onChange={(e) => setConfigText(e.target.value)}
      />
      <div>
        <button className="button" onClick={handleSave}>Save Config</button>
        <hr/>
        <button className="button" onClick={handleReindex} disabled={loading}>
          {loading ? 'Indexing...' : 'Run Indexing'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
