import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { View } from 'react-native';
import Modal from 'react-native-modal';
import { ActivityIndicator } from 'react-native-paper';

const LoadingModal = ({ isVisible }: { isVisible: boolean }) => {
    const deviceWidth = Dimensions.get('window').width;
    const deviceHeight =
        // Platform.OS === 'ios'
            // ? 
            Dimensions.get('window').height
            // : require('react-native-extra-dimensions-android').get(
            //     'REAL_WINDOW_HEIGHT'
            // );

    return (
        <Modal
            animationIn="slideInUp"
            animationOut="slideOutDown"
            isVisible={isVisible}
            coverScreen
            className="mx-0"
            deviceWidth={deviceWidth}
            deviceHeight={deviceHeight}
        >
            <View className="mx-auto h-14 w-14 justify-center rounded-full border-[0.5px] border-white/20 bg-primary">
                <ActivityIndicator size={24} color="#fff" />
            </View>
        </Modal>
    );
};

export default LoadingModal;
