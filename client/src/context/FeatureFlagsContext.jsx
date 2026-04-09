/**
 * Feature flags: bật/tắt module AI & moderation theo cấu hình server (bảng system_settings).
 *
 * Luồng: mount → GET /api/settings/feature-flags → merge vào state (DEFAULT_FLAGS là fallback
 * khi API lỗi hoặc thiếu key). `isEnabled(key)` đọc boolean từ object `flags`.
 */
import PropTypes from 'prop-types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

/** Giá trị ban đầu trước khi tải từ server — đồng bộ với DEFAULT_FEATURE_FLAGS phía server khi có thể */
const DEFAULT_FLAGS = {
  ai_chatbot: true,
  ai_resume_analysis: true,
  ai_job_matching: true,
  ai_moderation: true,
  ai_career_roadmap: true,
  ai_screening_enabled: true,
  company_moderation_required: true,
  experimental_analytics_cards: false,
};

const FeatureFlagsContext = createContext({
  flags: DEFAULT_FLAGS,
  refreshFlags: async () => {},
  isEnabled: () => true,
});

async function fetchFeatureFlagsPayload() {
  const response = await api.get('settings/feature-flags');
  if (response.data?.success) {
    return response.data.data || {};
  }
  return null;
}

function logFeatureFlagsLoadError(error) {
  console.error('Failed to load feature flags:', error);
}

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  /** Merge patch; giữ reference cũ nếu không đổi giá trị → bớt re-render cây Provider. */
  const applyFlagsPatch = useCallback((patch) => {
    if (!patch || typeof patch !== 'object') return;
    setFlags((current) => {
      let changed = false;
      const next = { ...current };
      for (const [k, v] of Object.entries(patch)) {
        if (Object.hasOwn(patch, k) && next[k] !== v) {
          next[k] = v;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, []);

  const refreshFlags = useCallback(async () => {
    try {
      applyFlagsPatch(await fetchFeatureFlagsPayload());
    } catch (error) {
      logFeatureFlagsLoadError(error);
    }
  }, [applyFlagsPatch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const patch = await fetchFeatureFlagsPayload();
        if (cancelled) return;
        applyFlagsPatch(patch);
      } catch (error) {
        if (!cancelled) logFeatureFlagsLoadError(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyFlagsPatch]);

  const value = useMemo(
    () => ({
      flags,
      refreshFlags,
      isEnabled: (key) => Boolean(flags[key]),
    }),
    [flags, refreshFlags]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

FeatureFlagsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFeatureFlags = () => useContext(FeatureFlagsContext);
