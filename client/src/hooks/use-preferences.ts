import { useState, useEffect } from 'react';

interface UserPreferences {
  boardTheme: 'green' | 'brown' | 'blue' | 'coral' | 'purple' | 'midnight' | 'modern';
  boardOrientation: 'white' | 'black';
  soundEnabled: boolean;
  hintType: 'verbal' | 'directional';
}

const defaultPreferences: UserPreferences = {
  boardTheme: 'green',
  boardOrientation: 'white',
  soundEnabled: true,
  hintType: 'verbal'
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem('chesscrunch_preferences');
    return stored ? JSON.parse(stored) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('chesscrunch_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return {
    preferences,
    updatePreference
  };
}

export type { UserPreferences };
