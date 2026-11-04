const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

class AgoraService {
  // Read at call time, so settings are never captured before they are loaded
  get appId() {
    return process.env.AGORA_APP_ID;
  }

  get appCertificate() {
    return process.env.AGORA_APP_CERTIFICATE;
  }

  generateToken(channelName, uid, role = RtcRole.PUBLISHER) {
    // Set different expiration times based on role
    const expirationTimes = {
      [RtcRole.PUBLISHER]: 3600, // 1 hour
      [RtcRole.SUBSCRIBER]: 86400 // 24 hours
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