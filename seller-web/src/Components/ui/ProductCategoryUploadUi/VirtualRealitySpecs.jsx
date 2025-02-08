import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const VirtualRealitySpecs = ({ specs, onChange }) => {
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

  const vrModels = [
    'Oculus',
    'HTC Vive',
    'PlayStation VR'
  ];

  const features = [
    'Adjustable Straps',
    'Built-In Microphone',
    'Motion Controllers',
    'Room Scale Tracking',
    'Wireless',
    'Hand Tracking'
  ];

  const genres = [
    'Action',
    'Simulation',
    'Horror',
    'Adventure',
    'Fitness',
    'Social'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">VR Model</label>
        <Autocomplete
          options={vrModels}
          value={specs.gaming_vrModel || ''}
          onChange={(_, newValue) => onChange('gaming_vrModel', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select VR model"
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
          value={specs.gaming_vrFeatures || []}
          onChange={(_, newValue) => onChange('gaming_vrFeatures', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Compatible Genres</label>
        <Autocomplete
          multiple
          options={genres}
          value={specs.gaming_vrGenres || []}
          onChange={(_, newValue) => onChange('gaming_vrGenres', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select compatible genres"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Platform Compatibility</label>
        <Autocomplete
          multiple
          options={vrModels}
          value={specs.gaming_vrCompatibility || []}
          onChange={(_, newValue) => onChange('gaming_vrCompatibility', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select compatible platforms"
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

VirtualRealitySpecs.propTypes = {
  specs: PropTypes.shape({
    gaming_vrModel: PropTypes.string,
    gaming_vrFeatures: PropTypes.arrayOf(PropTypes.string),
    gaming_vrGenres: PropTypes.arrayOf(PropTypes.string),
    gaming_vrCompatibility: PropTypes.arrayOf(PropTypes.string)
  }),
  onChange: PropTypes.func.isRequired
};

export default VirtualRealitySpecs; 