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
          // Check if user has published video and subscribe only if available
          if (user.hasVideo) {
            try {
              await client.subscribe(user, "video");
              window.ReactNativeWebView.postMessage("subscribed_video:" + user.uid);
              
              // Play video onto the host-video div
              if (user.videoTrack) {
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
            } catch (videoErr) {
              window.ReactNativeWebView.postMessage("error:subscribe_video:" + videoErr.message);
            }
          }
          
          // Check if user has published audio and subscribe only if available
          if (user.hasAudio) {
            try {
              await client.subscribe(user, "audio");
              window.ReactNativeWebView.postMessage("subscribed_audio:" + user.uid);
              
              // Play audio immediately
              if (user.audioTrack) {
                user.audioTrack.play();
                window.ReactNativeWebView.postMessage("audio_playing:" + user.uid);
              }
            } catch (audioErr) {
              window.ReactNativeWebView.postMessage("error:subscribe_audio:" + audioErr.message);
            }
          } else {
            window.ReactNativeWebView.postMessage("audio_not_published:" + user.uid);
          }
          
          // If no audio but video exists, still consider the host present
          if (user.hasVideo && !user.hasAudio) {
            window.ReactNativeWebView.postMessage("host_video_only:" + user.uid);
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
      
      // Function to leave the channel
      window.leaveChannel = async function() {
        try {
          if (client) {
            window.ReactNativeWebView.postMessage("leaving_channel_start");
            
            // Debug: Log current state
            const remoteUserCount = Object.keys(remoteUsers).length;
            const clientRemoteUsers = client.remoteUsers || [];
            window.ReactNativeWebView.postMessage("debug:remoteUsers_count:" + remoteUserCount);
            window.ReactNativeWebView.postMessage("debug:client_remoteUsers_count:" + clientRemoteUsers.length);
            
            // Step 1: Use client.remoteUsers instead of our remoteUsers object for more reliable cleanup
            const usersToCleanup = clientRemoteUsers.length > 0 ? clientRemoteUsers : Object.values(remoteUsers);
            
            window.ReactNativeWebView.postMessage("debug:users_to_cleanup:" + usersToCleanup.length);
            
            // Step 1a: Stop all remote video and audio tracks
            usersToCleanup.forEach(user => {
              window.ReactNativeWebView.postMessage("debug:processing_user:" + user.uid);
              window.ReactNativeWebView.postMessage("debug:user_hasVideo:" + (user.hasVideo || false));
              window.ReactNativeWebView.postMessage("debug:user_hasAudio:" + (user.hasAudio || false));
              window.ReactNativeWebView.postMessage("debug:user_videoTrack:" + (user.videoTrack ? "exists" : "null"));
              window.ReactNativeWebView.postMessage("debug:user_audioTrack:" + (user.audioTrack ? "exists" : "null"));
              
              try {
                // Stop video track if it exists
                if (user.videoTrack) {
                  user.videoTrack.stop();
                  window.ReactNativeWebView.postMessage("stopped_video_track:" + user.uid);
                } else {
                  window.ReactNativeWebView.postMessage("debug:no_video_track_to_stop:" + user.uid);
                }
                
                // Stop audio track if it exists
                if (user.audioTrack) {
                  user.audioTrack.stop();
                  window.ReactNativeWebView.postMessage("stopped_audio_track:" + user.uid);
                } else {
                  window.ReactNativeWebView.postMessage("debug:no_audio_track_to_stop:" + user.uid);
                }
              } catch (trackErr) {
                window.ReactNativeWebView.postMessage("error:stop_track:" + user.uid + ":" + trackErr.message);
              }
            });
            
            // Step 1b: Also try to stop tracks using a different approach - iterate through all subscribed tracks
            try {
              // Get all local audio tracks and stop them (in case we have any local tracks)
              const localTracks = AgoraRTC.getDevices ? [] : [];
              
              // For remote tracks, we'll unsubscribe which should also stop them
              window.ReactNativeWebView.postMessage("debug:starting_unsubscribe_process");
              
            } catch (altErr) {
              window.ReactNativeWebView.postMessage("debug:alt_cleanup_error:" + altErr.message);
            }
            
            // Step 2: Unsubscribe from all remote users (this should also stop the tracks)
            for (const user of usersToCleanup) {
              try {
                window.ReactNativeWebView.postMessage("debug:unsubscribing_from:" + user.uid);
                
                if (user.hasVideo && user.videoTrack) {
                  await client.unsubscribe(user, "video");
                  window.ReactNativeWebView.postMessage("unsubscribed_video:" + user.uid);
                }
                if (user.hasAudio && user.audioTrack) {
                  await client.unsubscribe(user, "audio");
                  window.ReactNativeWebView.postMessage("unsubscribed_audio:" + user.uid);
                }
                
                // Force stop tracks after unsubscribing
                if (user.videoTrack) {
                  try {
                    user.videoTrack.stop();
                    window.ReactNativeWebView.postMessage("force_stopped_video:" + user.uid);
                  } catch (e) {
                    window.ReactNativeWebView.postMessage("debug:video_already_stopped:" + user.uid);
                  }
                }
                if (user.audioTrack) {
                  try {
                    user.audioTrack.stop();
                    window.ReactNativeWebView.postMessage("force_stopped_audio:" + user.uid);
                  } catch (e) {
                    window.ReactNativeWebView.postMessage("debug:audio_already_stopped:" + user.uid);
                  }
                }
              } catch (unsubErr) {
                window.ReactNativeWebView.postMessage("error:unsubscribe:" + user.uid + ":" + unsubErr.message);
              }
            }
            
            // Step 3: Leave the channel
            await client.leave();
            window.ReactNativeWebView.postMessage("channel_left");
            
            // Step 4: Clean up all resources and references
            remoteUsers = {};
            hasHostVideo = false;
            
            // Clear any timeouts
            if (hostCheckTimeout) {
              clearTimeout(hostCheckTimeout);
              hostCheckTimeout = null;
            }
            
            // Clear video container
            const playerDiv = document.getElementById("host-video");
            if (playerDiv) {
              playerDiv.innerHTML = "";
            }
            
            window.ReactNativeWebView.postMessage("cleanup_complete");
          } else {
            window.ReactNativeWebView.postMessage("debug:no_client_to_cleanup");
          }
        } catch (err) {
          window.ReactNativeWebView.postMessage("error:leave_channel:" + err.message);
        }
      }
    </script>
  </body>
</html>
`; 