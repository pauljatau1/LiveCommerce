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
      #video-container { 
        width: 100vw; 
        height: 100vh; 
        position: relative;
      }
    </style>
  </head>
  <body>
    <div id="video-container"></div>
    <script>
      let client;
      let remoteTracks = {};

      async function initializeAgora() {
        try {
          // 1. Create client FIRST
          client = AgoraRTC.createClient({
            mode: "live",
            codec: "vp8",
            role: "audience"
          });

          // 2. SET UP HANDLERS BEFORE JOINING (CRUCIAL)
          client.on("user-published", async (user, mediaType) => {
            console.log('Host published:', user.uid, mediaType);
            window.ReactNativeWebView.postMessage('host_published:' + mediaType);

            try {
              // 3. Subscribe FIRST before playing
              await client.subscribe(user, mediaType);
              
              // 4. Handle video track
              if (mediaType === "video") {
                const videoContainer = document.getElementById('video-container');
                videoContainer.innerHTML = ''; // Clear previous
                user.videoTrack.play(videoContainer, {
                  fit: "cover",
                  mirror: false
                });
              }
              
              // 5. Handle audio track
              if (mediaType === "audio") {
                user.audioTrack.play();
              }

              // Store tracks
              remoteTracks[user.uid] = user;

            } catch (error) {
              console.error("Subscribe failed:", error);
              window.ReactNativeWebView.postMessage('error:' + error.message);
            }
          });

          client.on("user-unpublished", (user) => {
            console.log('Host unpublished:', user.uid);
            if(remoteTracks[user.uid]) {
              delete remoteTracks[user.uid];
              const container = document.getElementById('video-container');
              container.innerHTML = '';
              window.ReactNativeWebView.postMessage('host_unpublished');
            }
          });

          // 6. JOIN CHANNEL AFTER HANDLERS ARE SET
          await client.join(
            "${appId}",
            "${channel}",
            "${token}",
            "${uid}"
          );
          
          window.ReactNativeWebView.postMessage('joined_success');

        } catch (error) {
          console.error("Join failed:", error);
          window.ReactNativeWebView.postMessage('error:' + error.message);
        }
      }

      // Initialize when loaded
      initializeAgora();

      // Cleanup
      window.leaveChannel = async () => {
        if(client) {
          await client.leave();
          client.removeAllListeners();
        }
      }
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
        channel: streamDetails.channelName,
        token: streamDetails.token,
        uid: streamDetails.uid
      });
    } catch (error) {
      console.error('Error setting up livestream:', error);
      setStatus('Error: ' + error.message);
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

    switch(true) {
      case message === 'joined_success':
        setStatus('Connected - Waiting for host stream...');
        break;
      case message.startsWith('host_published'):
        const mediaType = message.split(':')[1];
        setStatus(`Host ${mediaType} stream playing...`);
        break;
      case message === 'host_unpublished':
        setStatus('Host disconnected');
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
              style={styles.fullscreen}
              source={{
                html: getHtmlContent(
                  streamConfig.appId,
                  streamConfig.channel,
                  streamConfig.token,
                  streamConfig.uid
                )
              }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
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