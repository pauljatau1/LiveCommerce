import RtcEngine, { ClientRole, ChannelProfile } from 'react-native-agora';

class AgoraService {
  engine: RtcEngine | null = null;

  async initialize() {
    try {
      this.engine = await RtcEngine.create(process.env.EXPO_PUBLIC_AGORA_APP_ID!);
      
      // Enable video
      await this.engine.enableVideo();
      
      // Set channel profile as live streaming
      await this.engine.setChannelProfile(ChannelProfile.LiveBroadcasting);
      
      // Set client role as audience
      await this.engine.setClientRole(ClientRole.Audience);
      
      return this.engine;
    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      throw error;
    }
  }

  async joinChannel(channelName: string) {
    if (!this.engine) throw new Error('Agora Engine not initialized');

    try {
      await this.engine.joinChannel(
        null, // Token (use null for testing, implement token server for production)
        channelName,
        null,
        0
      );
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
  }

  async leaveChannel() {
    if (!this.engine) return;
    await this.engine.leaveChannel();
  }

  async destroy() {
    if (!this.engine) return;
    await this.leaveChannel();
    await this.engine.destroy();
  }
}

export default new AgoraService();
