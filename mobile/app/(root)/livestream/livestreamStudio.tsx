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
      #video-container { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="video-container"></div>
    <script>
      let client;
      
      async function initializeAgora() {
        try {
          // 1. Create client with broadcast mode
          client = AgoraRTC.createClient({
            mode: "live",
            codec: "vp8",
            role: "audience"
          });

          // 2. Setup event handlers first
          client.on("user-published", async (user, mediaType) => {
            console.log('Host published stream');
            window.ReactNativeWebView.postMessage('host_published');
            
            try {
              await client.subscribe(user, mediaType);
              
              if (mediaType === "video") {
                const videoContainer = document.getElementById('video-container');
                const videoElement = document.createElement("div");
                videoElement.id = user.uid;
                videoContainer.appendChild(videoElement);
                
                user.videoTrack.play(videoElement, {
                  fit: "cover",
                  mirror: false
                });
              }
              
              if (mediaType === "audio") {
                user.audioTrack.play();
              }
            } catch (error) {
              console.error("Subscription error:", error);
              window.ReactNativeWebView.postMessage('error:' + error.message);
            }
          });

          client.on("user-unpublished", (user) => {
            const element = document.getElementById(user.uid);
            if(element) element.remove();
            window.ReactNativeWebView.postMessage('host_unpublished');
          });

          // 3. Join channel
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

      // Cleanup handler
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
        appId: process.env.EXPO_PUBLIC_AGORA_APP_ID,
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

    switch(message) {
      case 'joined_success':
        setStatus('Waiting for host...');
        setIsLoading(false);
        break;
      case 'host_published':
        setStatus('Host video playing...');
        break;
      case 'host_unpublished':
        setStatus('Host left the stream');
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