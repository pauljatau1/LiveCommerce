import { View, SafeAreaView, StyleSheet, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useLivestream } from '@/contexts/livestreamContext';
import AgoraService from '@/services/agoraService';
import { RtcLocalView, RtcRemoteView, VideoRenderMode } from 'react-native-agora';

const { width, height } = Dimensions.get('window');

const LivestreamStudio = () => {
  const { id } = useLocalSearchParams();
  const { activeStreamDetails, fetchActiveStreamDetails } = useLivestream();
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  useEffect(() => {
    setupLivestream();
    return () => {
      cleanup();
    };
  }, [id]);

  const setupLivestream = async () => {
    if (!id) return;

    try {
      const engine = await AgoraService.initialize();
      
      // Set up event listeners
      engine.addListener('UserJoined', (uid, elapsed) => {
        console.log('Host joined:', uid);
        setRemoteUid(uid);
      });

      engine.addListener('UserOffline', (uid, reason) => {
        console.log('Host left:', uid);
        setRemoteUid(null);
      });

      // Join channel using stream ID
      await AgoraService.joinChannel(id as string);
      await fetchActiveStreamDetails(id as string);
    } catch (error) {
      console.error('Error setting up livestream:', error);
    }
  };

  const cleanup = async () => {
    await AgoraService.destroy();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        {remoteUid ? (
          <RtcRemoteView.SurfaceView
            uid={remoteUid}
            style={styles.fullscreen}
            channelId={id as string}
            renderMode={VideoRenderMode.Hidden}
          />
        ) : null}
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
});

export default LivestreamStudio;