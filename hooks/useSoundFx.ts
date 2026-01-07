
import { useCallback } from 'react';
import { useSettingsStore } from '../lib/store/settings';
import { soundEngine } from '../lib/soundEngine';

export function useSoundFx() {
  const { settings } = useSettingsStore();

  const playClick = useCallback(() => {
    if (settings.enableSFX) soundEngine.playClick();
  }, [settings.enableSFX]);

  const playToggle = useCallback((isOn: boolean) => {
    if (settings.enableSFX) soundEngine.playToggle(isOn);
  }, [settings.enableSFX]);

  const playSuccess = useCallback(() => {
    if (settings.enableSFX) soundEngine.playSuccess();
  }, [settings.enableSFX]);

  const playError = useCallback(() => {
    if (settings.enableSFX) soundEngine.playError();
  }, [settings.enableSFX]);

  const playType = useCallback(() => {
    if (settings.enableSFX) soundEngine.playType();
  }, [settings.enableSFX]);

  const playBlip = useCallback(() => {
    if (settings.enableSFX) soundEngine.playBlip();
  }, [settings.enableSFX]);

  const playSweep = useCallback(() => {
    if (settings.enableSFX) soundEngine.playSweep();
  }, [settings.enableSFX]);

  // New Electrical Sounds
  const playSpark = useCallback(() => {
    if (settings.enableSFX) soundEngine.playSpark();
  }, [settings.enableSFX]);

  const playCharge = useCallback(() => {
    if (settings.enableSFX) soundEngine.playCharge();
  }, [settings.enableSFX]);

  const playLightning = useCallback((intensity: number) => {
    if (settings.enableSFX) soundEngine.playLightning(intensity);
  }, [settings.enableSFX]);

  return { 
    playClick, 
    playToggle, 
    playSuccess, 
    playError, 
    playType, 
    playBlip, 
    playSweep,
    playSpark,
    playCharge,
    playLightning
  };
}