import { loadSettings, saveSettings, type Settings } from "../storage/settings";

class SettingsState {
  value = $state<Settings>(loadSettings());

  update(patch: Partial<Settings>) {
    this.value = { ...this.value, ...patch };
    saveSettings($state.snapshot(this.value) as Settings);
  }
}

export const settings = new SettingsState();
