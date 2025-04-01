/**
 * HTML content template for Agora livestream WebView
 */
export const streamEngine = (appId: string, channel: string, token: string, uid: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.21.0.js"></script>
    <style>
      body { margin: 0; padding: 0; background: black; }
      #video-container { width: 100vw; height: 100vh; position: relative; }
      #host-video { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="video-container">
      <div id="host-video"></div>
    </div>
    <script>
      // Global references to important objects
      let client;
      let remoteUsers = {};
      let hostCheckTimeout;
      let hasHostVideo = false;
      
      async function joinAsAudience() {
        try {
          // Create Agora client
          client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
          
          // Set role to audience
          await client.setClientRole("audience");
          
          window.ReactNativeWebView.postMessage('initializing');
          
          // Register all user events BEFORE joining
          registerEvents();
          
          // Join the channel with token
          await client.join("${appId}", "${channel}", "${token}", ${uid});
          window.ReactNativeWebView.postMessage('joined_channel');
          
          // After joining, log all users currently in the channel
          window.ReactNativeWebView.postMessage('users_in_channel:' + client.remoteUsers.length);
          client.remoteUsers.forEach(user => {
            window.ReactNativeWebView.postMessage('remote_user:' + user.uid);
            
            // Auto-subscribe to existing users
            subscribeToUser(user);
          });
          
          // Start a timeout to check if any host is present
          startHostCheckTimeout();
        } catch (error) {
          console.error("Error joining:", error);
          window.ReactNativeWebView.postMessage("error:" + error.message);
        }
      }
      
      function startHostCheckTimeout() {
        // Clear any existing timeout
        if (hostCheckTimeout) {
          clearTimeout(hostCheckTimeout);
        }
        
        // Set a 5-second timeout to check if any host video has been detected
        hostCheckTimeout = setTimeout(() => {
          if (!hasHostVideo && Object.keys(remoteUsers).length === 0) {
            window.ReactNativeWebView.postMessage("no_host_present");
          }
        }, 5000);
      }
      
      function registerEvents() {
        // When remote user publishes a stream
        client.on("user-published", async (user, mediaType) => {
          window.ReactNativeWebView.postMessage("user_published:" + user.uid + ":" + mediaType);
          
          // Save remote user to our object
          remoteUsers[user.uid] = user;
          
          if (mediaType === "video") {
            hasHostVideo = true;
            // If we had previously sent a no_host_present message, now send host_joined
            window.ReactNativeWebView.postMessage("host_video_detected");
          }
          
          // Subscribe to the remote user
          await subscribeToUser(user);
        });
        
        // When remote user stops publishing
        client.on("user-unpublished", (user, mediaType) => {
          window.ReactNativeWebView.postMessage("user_unpublished:" + user.uid + ":" + mediaType);
          
          if (mediaType === "video") {
            // Check if there are still other hosts with video
            const otherHostsWithVideo = Object.values(remoteUsers).some(u => 
              u.uid !== user.uid && u.hasVideo && u.videoTrack
            );
            
            if (!otherHostsWithVideo) {
              hasHostVideo = false;
              window.ReactNativeWebView.postMessage("host_left_video");
            }
          }
        });
        
        // When remote user joins
        client.on("user-joined", (user) => {
          window.ReactNativeWebView.postMessage("user_joined:" + user.uid);
          remoteUsers[user.uid] = user;
        });
        
        // When remote user leaves
        client.on("user-left", (user) => {
          window.ReactNativeWebView.postMessage("user_left:" + user.uid);
          delete remoteUsers[user.uid];
          
          // Check if there are no more remote users after this one left
          if (Object.keys(remoteUsers).length === 0) {
            hasHostVideo = false;
            window.ReactNativeWebView.postMessage("all_hosts_left");
          }
        });
        
        // Connection state changes
        client.on("connection-state-change", (newState) => {
          window.ReactNativeWebView.postMessage("connection:" + newState);
        });
      }
      
      async function subscribeToUser(user) {
        try {
          // Subscribe to the video/audio tracks
          await client.subscribe(user, "video");
          window.ReactNativeWebView.postMessage("subscribed_video:" + user.uid);
          
          await client.subscribe(user, "audio");
          window.ReactNativeWebView.postMessage("subscribed_audio:" + user.uid);
          
          // Play audio immediately
          if (user.audioTrack) {
            user.audioTrack.play();
            window.ReactNativeWebView.postMessage("audio_playing:" + user.uid);
          }
          
          // Play video onto the host-video div
          if (user.videoTrack) {
            // Create a guaranteed unique ID
            const playerDiv = document.getElementById("host-video");
            if (playerDiv) {
              // Play the video - use cover to fill container
              user.videoTrack.play(playerDiv, { fit: "cover" });
              window.ReactNativeWebView.postMessage("video_playing:" + user.uid);
              
              // Mark that we have detected host video
              hasHostVideo = true;
              
              // Clear any timeout for host check since we found a host
              if (hostCheckTimeout) {
                clearTimeout(hostCheckTimeout);
                hostCheckTimeout = null;
              }
            } else {
              window.ReactNativeWebView.postMessage("error:video_container_missing");
            }
          }
        } catch (err) {
          window.ReactNativeWebView.postMessage("error:subscribe:" + err.message);
        }
      }
      
      // Function to mute/unmute all audio tracks
      window.toggleAudioMute = function(mute) {
        try {
          Object.values(remoteUsers).forEach(user => {
            if (user.audioTrack) {
              if (mute) {
                user.audioTrack.setVolume(0);
                window.ReactNativeWebView.postMessage("audio_muted:" + user.uid);
              } else {
                user.audioTrack.setVolume(100);
                window.ReactNativeWebView.postMessage("audio_unmuted:" + user.uid);
              }
            }
          });
          window.ReactNativeWebView.postMessage(mute ? "all_audio_muted" : "all_audio_unmuted");
        } catch (err) {
          window.ReactNativeWebView.postMessage("error:toggle_mute:" + err.message);
        }
      }
      
      // Start everything
      joinAsAudience();
    </script>
  </body>
</html>
`; 