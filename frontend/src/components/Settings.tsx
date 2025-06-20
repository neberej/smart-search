import React, { useEffect, useState } from 'react';
import './Settings.scss';
import { getConfig, updateConfig, runReindex } from '../utils/api';

const Settings: React.FC<{ setToast: (msg: string) => void }> = ({ setToast }) => {
  const [config, setConfig] = useState({
    source_folder: '',
    index_folder: '',
    supported_extensions: [] as string[],
    chunk_size: 0,
    chunk_overlap: 0,
    embedding_model: '',
    min_score: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConfig().then((res) => setConfig(res.data));
  }, []);

  const handleInputChange = (key: string, value: string | string[] | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateConfig(config);
      setToast('Config saved.');
    } catch (e: any) {
      setToast('Failed to save: ' + e.message);
    }
  };

  const handleReindex = async () => {
    setLoading(true);
    try {
      const response = await runReindex();
      setToast(response?.data?.status || 'Indexing done.');
    } catch (e: any) {
      setToast('Indexing failed: ' + e.message);
    }
    setLoading(false);
  };

  const renderInput = (
    label: string,
    key: keyof typeof config,
    type: 'text' | 'number' | 'array',
    step?: string
  ) => {
    return (
      <div className="input-group">
        <label className="input-label">{label}</label>
        <input
          type={type === 'array' ? 'text' : type}
          step={step}
          value={
            type === 'array'
              ? (config[key] as string[]).join(', ')
              : config[key]
          }
          onChange={(e) =>
            handleInputChange(
              key,
              type === 'array'
                ? e.target.value.split(', ').map((ext) => ext.trim())
                : type === 'number'
                ? parseFloat(e.target.value) || 0
                : e.target.value
            )
          }
          className="input-field"
          placeholder={type === 'array' ? 'e.g., .pdf, .txt, .md' : undefined}
        />
      </div>
    );
  };

  return (
    <div className="settings-container">
      <h3 className="settings-title">Update Config</h3>
      <div className="input-container">
        {renderInput('Source Folder', 'source_folder', 'text')}
        {renderInput('Index Folder', 'index_folder', 'text')}
        {renderInput('Supported Extensions', 'supported_extensions', 'array')}
        {renderInput('Chunk Size', 'chunk_size', 'number')}
        {renderInput('Chunk Overlap', 'chunk_overlap', 'number')}
        {renderInput('Embedding Model', 'embedding_model', 'text')}
        {renderInput('Min Score', 'min_score', 'number', '0.01')}
      </div>
      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save Config
        </button>
      </div>
      <hr/>
      <div className="button-container left">
        <button
          className="index-button"
          onClick={handleReindex}
          disabled={loading}
        >
          {loading ? 'Indexing...' : 'Run Indexing'}
        </button>
      </div>
    </div>
  );
};

export default Settings;