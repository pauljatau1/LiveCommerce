import React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';


class Toast {
  error(message: string = '') {
    showMessage({
      message,
      type: 'info',
      backgroundColor: '#F04438',
      duration: 3000,
      icon: 'info'
    });
  }
  info(message: string = '') {
    showMessage({
      message,
      type: 'info',
      backgroundColor: '#258FE6',
      duration: 3000,
      icon: 'info',
    });
  }
  success(message: string = '') {
    showMessage({
      message,
      type: 'success',
      backgroundColor: '#2FB01A',
      duration: 3000,
      icon: 'success',
    });
  }
}

const toast = new Toast();

export { toast };
