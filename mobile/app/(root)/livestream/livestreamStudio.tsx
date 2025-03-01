import { View, SafeAreaView, StyleSheet, Dimensions, Text, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useLivestream } from '@/contexts/livestreamContext';
import AgoraService from '@/services/agoraService';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const getHtmlContent = (appId: string, channel: string, token: string, uid: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
        } catch (error) {
          console.error("Error joining:", error);
          window.ReactNativeWebView.postMessage("error:" + error.message);
        }
      }
      
      function registerEvents() {
        // When remote user publishes a stream
        client.on("user-published", async (user, mediaType) => {
          window.ReactNativeWebView.postMessage("user_published:" + user.uid + ":" + mediaType);
          
          // Save remote user to our object
          remoteUsers[user.uid] = user;
          
          // Subscribe to the remote user
          await subscribeToUser(user);
        });
        
        // When remote user stops publishing
        client.on("user-unpublished", (user, mediaType) => {
          window.ReactNativeWebView.postMessage("user_unpublished:" + user.uid + ":" + mediaType);
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
            } else {
              window.ReactNativeWebView.postMessage("error:video_container_missing");
            }
          }
        } catch (err) {
          window.ReactNativeWebView.postMessage("error:subscribe:" + err.message);
        }
      }
      
      // Start everything
      joinAsAudience();
    </script>
  </body>
</html>
`;

const LivestreamStudio = () => {
  const { id } = useLocalSearchParams();
  const { activeStreamDetails, joinStream } = useLivestream();
  const [streamConfig, setStreamConfig] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setupLivestream();
  }, [id]);

  const setupLivestream = async () => {
    if (!id) return;
    try {
      setStatus('Joining stream...');
      const streamDetails = await joinStream(id as string);
      console.log('Stream details:', streamDetails);
      
      setStreamConfig({
        appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
        channel: streamDetails?.channelName,
        token: streamDetails?.token,
        uid: streamDetails?.uid
      });
    } catch (error) {
      console.error('Error setting up livestream:', error);
      setStatus('Error: ' + (error as Error).message);
    }
  };

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    console.log('WebView message:', message);
    
    if(message.startsWith('error:')) {
      setStatus(message.replace('error:', 'Error: '));
      setIsLoading(false);
      return;
    }

    switch(message) {
      case 'joined_channel':
        setStatus('Connected to channel');
        setIsLoading(false);
        break;
      case message.startsWith('user_published:'):
        const mediaType = message.split(':')[1];
        setStatus(`Host ${mediaType} stream playing`);
        setIsLoading(false);
        break;
      case message.startsWith('connection:'):
        const state = message.split(':')[1];
        setStatus(`Connection: ${state}`);
        break;
      default:
        setStatus(message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {streamConfig ? (
          <>
            <WebView
              source={{
                html: getHtmlContent(
                  streamConfig.appId,
                  streamConfig.channel,
                  streamConfig.token,
                  streamConfig.uid
                ),
              }}
              style={styles.fullscreen}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              debuggingEnabled={true}
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.statusText}>{status}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
  fullscreen: {
    width: width,
    height: height,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    marginTop: 10,
  },
});

export default LivestreamStudio;