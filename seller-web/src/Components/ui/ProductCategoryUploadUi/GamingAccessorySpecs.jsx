import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const GamingAccessorySpecs = ({ specs, onChange }) => {
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.5rem',
      minHeight: '48px',
      height: 'auto',
      '& fieldset': { borderColor: '#02020238' },
      '&:hover fieldset': { borderColor: '#02020238' },
      '&.Mui-focused fieldset': { borderColor: '#02020238' }
    },
    '& .MuiInputBase-input': {
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#64748b',
      height: 'auto',
      minHeight: '1.4375em'
    },
    '& .MuiAutocomplete-tag': {
      margin: '3px'
    }
  };

  const accessoryTypes = [
    'Wireless Controller',
    'Wired Controller',
    'Custom Controller',
    'Wired Headset',
    'Wireless Headset',
    'Noise-Cancelling Headset',
    'Mechanical Keyboard',
    'Membrane Keyboard',
    'Wired Mouse',
    'Wireless Mouse',
    'External Hard Drive',
    'SSD',
    'Memory Card',
    'Oculus VR',
    'PlayStation VR',
    'Capture Card',
    'Streaming Kit'
  ];

  const compatibilityOptions = [
    'PlayStation',
    'Xbox',
    'PC',
    'Nintendo Switch'
  ];

  const features = [
    'Microphone',
    'Surround Sound',
    'RGB',
    'Compact',
    'DPI Settings',
    'RGB Lighting',
    'Motion Tracking',
    'Built-In Audio'
  ];

  const capacityOptions = [
    '500GB',
    '1TB',
    '2TB',
    '4TB'
  ];

  const resolutionOptions = [
    '1080p',
    '4K'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Accessory Type</label>
        <Autocomplete
          multiple
          options={accessoryTypes}
          value={specs.gaming_accessoryType || []}
          onChange={(_, newValue) => onChange('gaming_accessoryType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select accessory type"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Platform Compatibility</label>
        <Autocomplete
          multiple
          options={compatibilityOptions}
          value={specs.gaming_compatibility || []}
          onChange={(_, newValue) => onChange('gaming_compatibility', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select compatible platforms"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Features</label>
        <Autocomplete
          multiple
          options={features}
          value={specs.gaming_features || []}
          onChange={(_, newValue) => onChange('gaming_features', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select features"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Storage Capacity</label>
        <Autocomplete
          options={capacityOptions}
          value={specs.gaming_storageCapacity || ''}
          onChange={(_, newValue) => onChange('gaming_storageCapacity', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select storage capacity"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Resolution</label>
        <Autocomplete
          options={resolutionOptions}
          value={specs.gaming_resolution || ''}
          onChange={(_, newValue) => onChange('gaming_resolution', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select resolution"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Connection Type</label>
        <TextField
          fullWidth
          placeholder="Enter connection type (e.g., USB, Bluetooth)"
          value={specs.gaming_connectionType || ''}
          onChange={(e) => onChange('gaming_connectionType', e.target.value)}
          sx={inputStyles}
        />
      </div>
    </div>
  );
};

GamingAccessorySpecs.propTypes = {
  specs: PropTypes.shape({
    gaming_accessoryType: PropTypes.arrayOf(PropTypes.string),
    gaming_compatibility: PropTypes.arrayOf(PropTypes.string),
    gaming_features: PropTypes.arrayOf(PropTypes.string),
    gaming_storageCapacity: PropTypes.string,
    gaming_resolution: PropTypes.string,
    gaming_connectionType: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired
};

export default GamingAccessorySpecs; 