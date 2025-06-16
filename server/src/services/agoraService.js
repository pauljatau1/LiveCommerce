const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

class AgoraService {
  constructor() {
    this.appId = process.env.AGORA_APP_ID;
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE;
  }

  generateToken(channelName, uid, role = RtcRole.PUBLISHER) {
    // Set different expiration times based on role
    const expirationTimes = {
      [RtcRole.PUBLISHER]: 3600, // 1 hour
      [RtcRole.SUBSCRIBER]: 14400 // 4 hours
    };


    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimes[role];

    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
  }
}

module.exports = new AgoraService(); 