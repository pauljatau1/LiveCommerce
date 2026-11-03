import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';

// Preset configurations based on Agora documentation
const VIDEO_PRESETS = {
  low: {
    name: 'Low Data Usage',
    description: 'Optimized for minimal data consumption (300-400MB/hour)',
    encoderConfig: {
      width: 640,
      height: 480,
      frameRate: 15,
      bitrateMin: 400,
      bitrateMax: 600,
      optimizationMode: 'motion',
    },
    audioConfig: {
      sampleRate: 32000,
      stereo: false,
      bitrate: 24,
    },
    preset: '480p'
  },
  medium: {
    name: 'Balanced',
    description: 'Good quality with moderate data usage (600-800MB/hour)',
    encoderConfig: {
      width: 960,
      height: 540,
      frameRate: 24,
      bitrateMin: 600,
      bitrateMax: 1200,
      optimizationMode: 'motion',
    },
    audioConfig: {
      sampleRate: 44100,
      stereo: false,
      bitrate: 64,
    },
    preset: '540p'
  },
  high: {
    name: 'High Quality',
    description: 'HD quality with higher data usage (1.5-2GB/hour)',
    encoderConfig: {
      width: 1280,
      height: 720,
      frameRate: 30,
      bitrateMin: 1000,
      bitrateMax: 2000,
      optimizationMode: 'motion',
    },
    audioConfig: {
      sampleRate: 48000,
      stereo: true,
      bitrate: 96,
    },
    preset: '720p'
  },
  ultra: {
    name: 'Full Quality',
    description: 'Maximum quality, high data usage (2-4GB/hour)',
    encoderConfig: {
      width: 1920,
      height: 1080,
      frameRate: 60,
      bitrateMin: 1500,
      bitrateMax: 4000,
      optimizationMode: 'motion',
    },
    audioConfig: {
      sampleRate: 48000,
      stereo: true,
      bitrate: 128,
    },
    preset: '1080p'
  },
  mobileOptimized: {
    name: 'Mobile Optimized',
    description: 'Balanced for mobile viewers (500-700MB/hour)',
    encoderConfig: {
      width: 640,
      height: 360,
      frameRate: 20,
      bitrateMin: 400,
      bitrateMax: 800,
      optimizationMode: 'motion',
    },
    audioConfig: {
      sampleRate: 32000,
      stereo: false,
      bitrate: 48,
    },
    preset: '360p'
  }
};

// Agora preset options based on their documentation
const RESOLUTION_OPTIONS = [
  { label: '240p (320×240)', value: '240p' },
  { label: '360p (640×360)', value: '360p' },
  { label: '480p (640×480)', value: '480p' },
  { label: '720p (1280×720)', value: '720p' },
  { label: '1080p (1920×1080)', value: '1080p' }
];

const FRAMERATE_OPTIONS = [
  { label: '10 fps', value: 10 },
  { label: '15 fps', value: 15 },
  { label: '24 fps', value: 24 },
  { label: '30 fps', value: 30 },
  { label: '60 fps', value: 60 }
];

const BITRATE_OPTIONS = [
  { label: 'Very Low (400 Kbps)', min: 300, max: 500 },
  { label: 'Low (600 Kbps)', min: 500, max: 700 },
  { label: 'Medium (1000 Kbps)', min: 800, max: 1200 },
  { label: 'High (1500 Kbps)', min: 1000, max: 2000 },
  { label: 'Very High (3000 Kbps)', min: 1500, max: 4000 }
];

const OPTIMIZATION_OPTIONS = [
  { label: 'Motion (best for movement)', value: 'motion' },
  { label: 'Detail (best for clarity)', value: 'detail' }
];

const AUDIO_QUALITY_OPTIONS = [
  { label: 'Low (24 Kbps Mono)', value: { sampleRate: 32000, stereo: false, bitrate: 24 } },
  { label: 'Medium (48 Kbps Mono)', value: { sampleRate: 44100, stereo: false, bitrate: 48 } },
  { label: 'High (96 Kbps Stereo)', value: { sampleRate: 48000, stereo: true, bitrate: 96 } },
  { label: 'Premium (128 Kbps Stereo)', value: { sampleRate: 48000, stereo: true, bitrate: 128 } }
];

const VideoSettingsModal = ({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onApplySettings, 
  isStreaming = false 
}) => {
  const [activeTab, setActiveTab] = useState('video');
  const [selectedPreset, setSelectedPreset] = useState('low'); // Default to low data usage
  const [configMode, setConfigMode] = useState('quick'); // 'quick' or 'advanced'
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);
  const [showCapabilityWarning, setShowCapabilityWarning] = useState(false);
  
  // Manual configuration state
  const [resolution, setResolution] = useState('480p');
  const [frameRate, setFrameRate] = useState(15);
  const [bitrate, setBitrate] = useState({ min: 400, max: 600 });
  const [optimizationMode, setOptimizationMode] = useState('motion');
  const [audioQuality, setAudioQuality] = useState(AUDIO_QUALITY_OPTIONS[0].value);
  const [mirrorMode, setMirrorMode] = useState(true);

  // Initialize settings from current configuration
  useEffect(() => {
    if (currentSettings) {
      // Try to match current settings to a preset
      let matchedPreset = null;
      
      for (const [key, preset] of Object.entries(VIDEO_PRESETS)) {
        if (
          preset.encoderConfig.width === currentSettings.videoConfig?.width &&
          preset.encoderConfig.frameRate === currentSettings.videoConfig?.frameRate &&
          preset.encoderConfig.bitrateMax === currentSettings.videoConfig?.bitrateMax
        ) {
          matchedPreset = key;
          break;
        }
      }
      
      if (matchedPreset) {
        setSelectedPreset(matchedPreset);
        setConfigMode('quick');
      } else {
        setConfigMode('advanced');
        // Set manual settings
        setResolution(getResolutionFromDimensions(
          currentSettings.videoConfig?.width,
          currentSettings.videoConfig?.height
        ));
        setFrameRate(currentSettings.videoConfig?.frameRate || 15);
        setBitrate({
          min: currentSettings.videoConfig?.bitrateMin || 400,
          max: currentSettings.videoConfig?.bitrateMax || 600
        });
        setOptimizationMode(currentSettings.videoConfig?.optimizationMode || 'motion');
      }
      
      // Set audio quality and mirror mode regardless
      setAudioQuality({
        sampleRate: currentSettings.audioConfig?.sampleRate || 32000,
        stereo: currentSettings.audioConfig?.stereo || false,
        bitrate: currentSettings.audioConfig?.bitrate || 24
      });
      
      setMirrorMode(currentSettings.mirrorMode !== false);
    }
  }, [currentSettings]);

  // Get device capabilities
  useEffect(() => {
    async function getDeviceCapabilities() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              deviceId: videoDevices[0].deviceId,
              width: { ideal: 4096 },
              height: { ideal: 2160 },
              frameRate: { ideal: 60 }
            } 
          });
          
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
          
          if (capabilities) {
            setDeviceCapabilities(capabilities);
          }
        }
      } catch (error) {
        console.log('Unable to detect device capabilities:', error);
      }
    }
    
    if (isOpen) {
      getDeviceCapabilities();
    }
  }, [isOpen]);

  // Check if selected settings exceed device capabilities
  useEffect(() => {
    if (!deviceCapabilities) return;
    
    let currentConfig;
    if (configMode === 'quick') {
      currentConfig = VIDEO_PRESETS[selectedPreset].encoderConfig;
    } else {
      const dimensions = getDimensionsFromResolution(resolution);
      currentConfig = {
        width: dimensions.width,
        height: dimensions.height,
        frameRate
      };
    }
    
    const exceedsCapabilities = 
      (deviceCapabilities.width && deviceCapabilities.width.max && currentConfig.width > deviceCapabilities.width.max) ||
      (deviceCapabilities.height && deviceCapabilities.height.max && currentConfig.height > deviceCapabilities.height.max) ||
      (deviceCapabilities.frameRate && deviceCapabilities.frameRate.max && currentConfig.frameRate > deviceCapabilities.frameRate.max);
    
    setShowCapabilityWarning(exceedsCapabilities);
  }, [deviceCapabilities, configMode, selectedPreset, resolution, frameRate]);

  // Helper to match width/height to a preset resolution
  const getResolutionFromDimensions = (width, height) => {
    if (!width || !height) return '480p';
    
    if (width === 1920 && height === 1080) return '1080p';
    if (width === 1280 && height === 720) return '720p';
    if (width === 640 && height === 480) return '480p';
    if (width === 640 && height === 360) return '360p';
    if (width === 320 && height === 240) return '240p';
    
    // Default to closest match based on height
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    if (height >= 360) return '360p';
    return '240p';
  };

  // Get dimensions from resolution preset
  const getDimensionsFromResolution = (res) => {
    switch (res) {
      case '1080p': return { width: 1920, height: 1080 };
      case '720p': return { width: 1280, height: 720 };
      case '480p': return { width: 640, height: 480 };
      case '360p': return { width: 640, height: 360 };
      case '240p': return { width: 320, height: 240 };
      default: return { width: 640, height: 480 }; // Default to 480p
    }
  };

  const handleApplySettings = () => {
    let newSettings;
    
    if (configMode === 'quick') {
      // Apply preset configuration
      const preset = VIDEO_PRESETS[selectedPreset];
      newSettings = {
        videoConfig: { ...preset.encoderConfig },
        audioConfig: { ...preset.audioConfig },
        mirrorMode,
        preset: preset.preset
      };
    } else {
      // Apply manual configuration
      const dimensions = getDimensionsFromResolution(resolution);
      newSettings = {
        videoConfig: {
          width: dimensions.width,
          height: dimensions.height,
          frameRate,
          bitrateMin: bitrate.min,
          bitrateMax: bitrate.max,
          optimizationMode
        },
        audioConfig: { ...audioQuality },
        mirrorMode,
        preset: null // No preset when using manual configuration
      };
    }
    
    onApplySettings(newSettings);
    
    // Show warning if applying settings during active stream
    if (isStreaming) {
      // The warning is handled in the parent component
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-[90vh] max-w-2xl bg-[#0D0F12] border border-[#272A31] rounded-xl shadow-xl animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#272A31]">
          <div className="flex items-center gap-3">
            <div className="bg-[#272A31] p-2 rounded-full">
              <Icon icon="solar:settings-linear" className="w-5 h-5 text-[#14AE5C]" />
            </div>
            <h2 className="font-lexend text-lg xl:text-xl font-bold text-[#EFF0FA]">Stream Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[#7A828A] hover:text-white transition-colors"
          >
            <Icon icon="heroicons:x-mark" className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-[#272A31]">
          <div className="flex">
            <button 
              className={`py-3 px-6 font-medium text-sm transition-colors relative ${activeTab === 'video' ? 'text-[#14AE5C]' : 'text-[#7A828A] hover:text-[#EFF0FA]'}`}
              onClick={() => setActiveTab('video')}
            >
              Video Configuration
              {activeTab === 'video' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#14AE5C]"></div>}
            </button>
            <button 
              className={`py-3 px-6 font-medium text-sm transition-colors relative ${activeTab === 'camera' ? 'text-[#14AE5C]' : 'text-[#7A828A] hover:text-[#EFF0FA]'}`}
              onClick={() => setActiveTab('camera')}
            >
              Camera Settings
              {activeTab === 'camera' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#14AE5C]"></div>}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] 3xl:max-h-[70vh] overflow-y-auto 
        scroll-smooth 
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-[#272A31]
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-[#7A828A]
        hover:[&::-webkit-scrollbar-thumb]:bg-[#9CA3AF]">
          {activeTab === 'video' && (
            <div>
              {/* Configuration Mode Switch */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center bg-[#161A1E] rounded-lg p-1">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${configMode === 'quick' ? 'bg-[#272A31] text-white' : 'text-[#7A828A]'}`}
                    onClick={() => setConfigMode('quick')}
                  >
                    Quick Selection
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${configMode === 'advanced' ? 'bg-[#272A31] text-white' : 'text-[#7A828A]'}`}
                    onClick={() => setConfigMode('advanced')}
                  >
                    Advanced Settings
                  </button>
                </div>
              </div>
              
              {configMode === 'quick' ? (
                /* Quick Presets */
                <div className="space-y-5">
                  <p className="text-[#EFF0FA] text-sm mb-3 text-center">Choose a pre-configured quality setting:</p>
                  {Object.entries(VIDEO_PRESETS).map(([key, preset]) => (
                    <div 
                      key={key}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${selectedPreset === key ? 'border-[#14AE5C] bg-[#14AE5C]/10' : 'border-[#272A31] hover:bg-[#161A1E]'}`}
                      onClick={() => setSelectedPreset(key)}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedPreset === key ? 'bg-[#14AE5C]' : 'border border-[#7A828A]'}`}>
                        {selectedPreset === key && <Icon icon="heroicons:check" className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#EFF0FA] text-sm font-medium">{preset.name}</h3>
                        <p className="text-[#7A828A] text-xs">{preset.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 bg-[#272A31] rounded-full text-[#EFF0FA]">
                            {preset.encoderConfig.width}×{preset.encoderConfig.height}
                          </span>
                          <span className="text-xs px-2 py-1 bg-[#272A31] rounded-full text-[#EFF0FA]">
                            {preset.encoderConfig.frameRate} fps
                          </span>
                          <span className="text-xs px-2 py-1 bg-[#272A31] rounded-full text-[#EFF0FA]">
                            {preset.encoderConfig.bitrateMax} Kbps
                          </span>
                          {preset.audioConfig.stereo && (
                            <span className="text-xs px-2 py-1 bg-[#272A31] rounded-full text-[#EFF0FA]">
                              Stereo Audio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Advanced Manual Configuration */
                <div className="space-y-6">
                  {/* Resolution */}
                  <div>
                    <label className="block text-[#EFF0FA] font-medium mb-2">Resolution</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {RESOLUTION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          className={`px-3 py-2 text-xs xl:text-sm rounded-lg transition-colors ${resolution === option.value ? 'bg-[#14AE5C] text-white' : 'bg-[#161A1E] text-[#7A828A] hover:bg-[#272A31]'}`}
                          onClick={() => setResolution(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Frame Rate */}
                  <div>
                    <label className="block text-[#EFF0FA] font-medium mb-2">Frame Rate</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {FRAMERATE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          className={`px-3 py-2 text-xs xl:text-sm rounded-lg transition-colors ${frameRate === option.value ? 'bg-[#14AE5C] text-white' : 'bg-[#161A1E] text-[#7A828A] hover:bg-[#272A31]'}`}
                          onClick={() => setFrameRate(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bitrate */}
                  <div>
                    <label className="block text-[#EFF0FA] font-medium mb-2">Video Bitrate</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {BITRATE_OPTIONS.map((option, index) => (
                        <button
                          key={index}
                          className={`px-3 py-2 text-xs xl:text-sm rounded-lg transition-colors ${bitrate.max === option.max ? 'bg-[#14AE5C] text-white' : 'bg-[#161A1E] text-[#7A828A] hover:bg-[#272A31]'}`}
                          onClick={() => setBitrate({ min: option.min, max: option.max })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Optimization Mode */}
                  <div>
                    <label className="block text-[#EFF0FA] font-medium mb-2">Optimization Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {OPTIMIZATION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          className={`px-3 py-2 text-xs xl:text-sm rounded-lg transition-colors ${optimizationMode === option.value ? 'bg-[#14AE5C] text-white' : 'bg-[#161A1E] text-[#7A828A] hover:bg-[#272A31]'}`}
                          onClick={() => setOptimizationMode(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Audio Quality */}
                  <div>
                    <label className="block text-[#EFF0FA] font-medium mb-2">Audio Quality</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AUDIO_QUALITY_OPTIONS.map((option, index) => (
                        <button
                          key={index}
                          className={`px-3 py-2 text-xs xl:text-sm rounded-lg transition-colors ${
                            audioQuality.bitrate === option.value.bitrate && 
                            audioQuality.stereo === option.value.stereo ? 
                            'bg-[#14AE5C] text-white' : 
                            'bg-[#161A1E] text-[#7A828A] hover:bg-[#272A31]'
                          }`}
                          onClick={() => setAudioQuality(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mirror Mode Toggle (available in both config modes) */}
              <div className="mt-6 bg-[#161A1E] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[#EFF0FA] text-sm font-medium">Mirror Mode</h3>
                    <p className="text-[#7A828A] text-xs xl:text-sm">When using front camera, mirror the view</p>
                  </div>
                  <button 
                    onClick={() => setMirrorMode(!mirrorMode)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${mirrorMode ? 'bg-[#14AE5C]' : 'bg-[#272A31]'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${mirrorMode ? 'translate-x-5 md:translate-x-6' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Device Capability Warning */}
              {showCapabilityWarning && (
                <div className="mt-6 bg-[#F59E0B]/10 p-4 rounded-lg border border-[#F59E0B]/30">
                  <div className="flex items-start gap-3">
                    <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[#F59E0B] font-medium mb-1">Camera Capability Warning</h4>
                      <p className="text-[#EFF0FA] text-sm">
                        The selected quality settings may exceed your camera&apos;s capabilities. 
                        The stream will automatically use the highest supported quality available.
                      </p>
                      {deviceCapabilities && (
                        <div className="mt-2 text-xs text-[#A3A3A3]">
                          <p>Your camera supports: 
                            {deviceCapabilities.width && deviceCapabilities.height && 
                              ` up to ${deviceCapabilities.width.max}×${deviceCapabilities.height.max}`}
                            {deviceCapabilities.frameRate && 
                              ` at ${Math.floor(deviceCapabilities.frameRate.max)} fps`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for mid-stream changes */}
              {isStreaming && (
                <div className="mt-6 bg-[#C74E5B]/10 p-4 rounded-lg border border-[#C74E5B]/30">
                  <div className="flex items-start gap-3">
                    <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-[#C74E5B] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[#C74E5B] text-sm font-medium mb-1">Stream Will Update</h4>
                      <p className="text-[#EFF0FA] text-xs md:text-sm">
                        Changing stream settings during an active stream may cause a brief interruption for your viewers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'camera' && (
            <div className="text-center py-10">
              <Icon icon="heroicons:video-camera" className="w-16 h-16 text-[#7A828A] mx-auto mb-4" />
              <h3 className="text-[#EFF0FA] font-medium mb-2">Camera Settings</h3>
              <p className="text-[#7A828A] text-sm max-w-md mx-auto">
                You can switch between front and back cameras during your stream using the camera switch button in the streaming interface.
              </p>
            </div>
          )}
        
        </div>
          {/* Footer */}
          <div className="absolute bottom-0 left-0 w-full bg-[#0D0F12] flex justify-end gap-3 p-4 border rounded-b-xl border-[#272A31]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#EFF0FA] bg-[#272A31] rounded-lg hover:bg-[#3A3E47] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleApplySettings}
            className="px-4 py-2 text-white text-sm bg-[#14AE5C] rounded-lg hover:bg-[#14AE5C]/90 transition-colors flex items-center gap-2"
          >
            <Icon icon="heroicons:check" className="w-4 h-4" />
            Apply Settings
          </button>
        </div>
        
      </div>
    </div>
  );
};

VideoSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentSettings: PropTypes.shape({
    videoConfig: PropTypes.object,
    audioConfig: PropTypes.object,
    mirrorMode: PropTypes.bool,
    preset: PropTypes.string
  }),
  onApplySettings: PropTypes.func.isRequired,
  isStreaming: PropTypes.bool
};

export default VideoSettingsModal; 