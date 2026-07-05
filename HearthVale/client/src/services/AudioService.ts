interface AudioTrackEntry {
  key: string;
  path?: string;
  stub?: boolean;
  loop?: boolean;
  volume?: number;
}

interface SfxEntry {
  key: string;
  path?: string;
  stub?: boolean;
  volume?: number;
}

interface AudioManifest {
  music: AudioTrackEntry[];
  sfx: SfxEntry[];
}

/** Neptune / Audio lane — loads manifest and plays stub or file-backed cues. */
export class AudioService {
  private manifest: AudioManifest | null = null;
  private musicById: Map<string, AudioTrackEntry> = new Map();
  private sfxById: Map<string, SfxEntry> = new Map();
  private currentMusicKey = '';
  private muted = false;

  async load(): Promise<void> {
    this.manifest = await loadJsonAsset<AudioManifest>('./audio/manifest.json');
    // Index by key for O(1) lookups instead of Array.find on every SFX/music call.
    this.musicById = new Map(this.manifest.music.map((m) => [m.key, m]));
    this.sfxById = new Map(this.manifest.sfx.map((s) => [s.key, s]));
  }

  playMapMusic(musicKey: string): void {
    if (!this.manifest || this.muted) return;
    if (this.currentMusicKey === musicKey) return;
    this.currentMusicKey = musicKey;

    const track = this.musicById.get(musicKey);
    if (!track) {
      console.warn(`[AudioService] missing music key: ${musicKey}`);
      return;
    }
    if (track.stub) {
      console.debug(`[AudioService] stub music: ${musicKey}`);
      return;
    }
    console.debug(`[AudioService] would play: ${track.path}`);
  }

  playSfx(key: string): void {
    if (!this.manifest || this.muted) return;
    const sfx = this.sfxById.get(key);
    if (!sfx) return;
    if (sfx.stub) {
      console.debug(`[AudioService] stub sfx: ${key}`);
      return;
    }
    console.debug(`[AudioService] would play sfx: ${sfx.path}`);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.currentMusicKey = '';
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }
}

export const audioService = new AudioService();
import { loadJsonAsset } from './jsonAssets.js';
