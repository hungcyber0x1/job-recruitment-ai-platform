import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';

import adminChatbotService from '../../../services/adminChatbotService';

const ChatbotConfigurations = () => {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const response = await adminChatbotService.getConfigurations();
      setConfigs(response.data?.data || {});
    } catch (error) {
      console.error('Error fetching configurations:', error);
      setMessage({ type: 'error', text: 'Lỗi tải cấu hình' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const configValues = {};
      Object.keys(configs).forEach((key) => {
        configValues[key] = configs[key]?.value;
      });

      await adminChatbotService.updateConfigurations(configValues);
      setMessage({ type: 'success', text: 'Cấu hình đã được lưu thành công.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving configurations:', error);
      setMessage({ type: 'error', text: 'Lỗi lưu cấu hình' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const configSections = [
    {
      title: 'Cấu hình AI model',
      configs: ['ai_model', 'temperature', 'max_tokens'],
    },
    {
      title: 'Cấu hình prompt',
      configs: ['system_prompt'],
    },
    {
      title: 'Tính năng',
      configs: ['enable_file_upload', 'enable_suggestions'],
    },
    {
      title: 'Giới hạn tần suất',
      configs: ['rate_limit_per_hour'],
    },
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            message.type === 'success'
              ? 'border-state-success/20 bg-state-success/10 text-state-success'
              : 'border-state-danger/20 bg-state-danger/10 text-state-danger'
          }`}
        >
          <AlertCircle size={20} />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Cấu hình chatbot</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchConfigurations}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-bold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>

      {configSections.map((section) => (
        <div key={section.title} className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">{section.title}</h3>
          <div className="space-y-4">
            {section.configs.map((configKey) => {
              const config = configs[configKey];
              if (!config) return null;

              const isBoolean = config.value === 'true' || config.value === 'false';
              const isTextarea = configKey === 'system_prompt';

              return (
                <div key={configKey} className="space-y-2">
                  <label className="block text-sm font-bold text-foreground">
                    {configKey.replace(/_/g, ' ').toUpperCase()}
                  </label>
                  <p className="mb-2 text-base text-muted-foreground">{config.description}</p>

                  {isBoolean ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleChange(configKey, 'true')}
                        className={`rounded-lg px-4 py-2 font-medium transition-all ${
                          config.value === 'true'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-border'
                        }`}
                      >
                        Bật
                      </button>
                      <button
                        onClick={() => handleChange(configKey, 'false')}
                        className={`rounded-lg px-4 py-2 font-medium transition-all ${
                          config.value === 'false'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-border'
                        }`}
                      >
                        Tắt
                      </button>
                    </div>
                  ) : isTextarea ? (
                    <textarea
                      value={config.value}
                      onChange={(event) => handleChange(configKey, event.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  ) : (
                    <input
                      type="text"
                      value={config.value}
                      onChange={(event) => handleChange(configKey, event.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  )}

                  {config.updated_at && (
                    <p className="text-base text-muted-foreground">
                      Cập nhật lần cuối: {new Date(config.updated_at).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatbotConfigurations;
