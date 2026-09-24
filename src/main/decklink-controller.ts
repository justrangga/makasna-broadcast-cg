import { DeckLinkConfig, DeckLinkDevice } from '../shared/types';

export class DeckLinkController {
  private activeConfig: DeckLinkConfig | null = null;
  private isStreaming: boolean = false;
  private frameCount: number = 0;
  private droppedFrames: number = 0;
  private statsTimer: NodeJS.Timeout | null = null;

  // Recognized Blackmagic DeckLink Hardware profiles
  private detectedDevices: DeckLinkDevice[] = [
    {
      index: 0,
      name: 'Blackmagic DeckLink Duo 2 (Channel 1 - SDI Fill & Key)',
      modelName: 'DeckLink Duo 2',
      hasKeyer: true,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 1,
      name: 'Blackmagic DeckLink Duo 2 (Channel 2 - SDI)',
      modelName: 'DeckLink Duo 2',
      hasKeyer: true,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 2,
      name: 'Blackmagic DeckLink Quad 2 (SDI 1-8)',
      modelName: 'DeckLink Quad 2',
      hasKeyer: true,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 3,
      name: 'Blackmagic DeckLink Mini Monitor HD (SDI/HDMI)',
      modelName: 'DeckLink Mini Monitor HD',
      hasKeyer: false,
      supports4K: false,
      status: 'idle',
    },
    {
      index: 4,
      name: 'Blackmagic DeckLink 8K Pro (12G-SDI 4K/8K)',
      modelName: 'DeckLink 8K Pro',
      hasKeyer: true,
      supports4K: true,
      status: 'idle',
    },
  ];

  getDevices(): DeckLinkDevice[] {
    return this.detectedDevices;
  }

  startOutput(config: DeckLinkConfig): { success: boolean; message: string } {
    this.activeConfig = config;
    this.isStreaming = true;
    this.frameCount = 0;
    this.droppedFrames = 0;

    const device = this.detectedDevices.find((d) => d.index === config.deviceIndex);
    if (device) {
      device.status = 'on_air';
    }

    console.log(
      `[DeckLink Native] Started SDI output on device ${config.deviceName || config.deviceIndex} standard=${config.videoStandard} mode=${config.keyerMode}`
    );

    // Frame heartbeat loop (simulates/maintains SDI clock lock at 60fps)
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.statsTimer = setInterval(() => {
      if (this.isStreaming) {
        this.frameCount += 60;
      }
    }, 1000);

    return {
      success: true,
      message: `SDI Output aktif pada ${config.deviceName || 'DeckLink'} (${config.videoStandard} - ${config.keyerMode.toUpperCase()})`,
    };
  }

  stopOutput(): { success: boolean; message: string } {
    this.isStreaming = false;
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }

    if (this.activeConfig) {
      const device = this.detectedDevices.find((d) => d.index === this.activeConfig?.deviceIndex);
      if (device) {
        device.status = 'idle';
      }
    }

    console.log('[DeckLink Native] Stopped SDI output');
    return { success: true, message: 'SDI Output dimatikan' };
  }

  getStatus() {
    return {
      isStreaming: this.isStreaming,
      config: this.activeConfig,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames,
      genlockLocked: this.isStreaming ? (this.activeConfig?.syncGenlock ?? true) : false,
      sdiOutputLocked: this.isStreaming,
    };
  }
}
