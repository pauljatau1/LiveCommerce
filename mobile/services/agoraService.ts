import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

class AgoraService {
  client: IAgoraRTCClient | null = null;
  
  async initialize() {
    try {
      this.client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
        role: "audience"
      });
      
      await this.client.setClientRole("audience");
      return this.client;
    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      throw error;
    }
  }

  async joinChannel(channelName: string, uid: string, token: string) {
    if (!this.client) throw new Error('Agora Client not initialized');

    try {
      await this.client.join(
        process.env.EXPO_PUBLIC_AGORA_APP_ID,
        channelName,
        token,
        uid
      );
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
  }

  async leaveChannel() {
    if (!this.client) return;
    await this.client.leave();
  }

  async destroy() {
    if (!this.client) return;
    await this.leaveChannel();
    this.client = null;
  }
}

export default new AgoraService();
