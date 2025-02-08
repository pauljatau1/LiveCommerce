import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const ConsoleSpecs = ({ specs, onChange }) => {
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

  const consoleModels = [
    'PS5',
    'PS4',
    'PS3',
    'Xbox Series X',
    'Xbox Series S',
    'Xbox One',
    'Nintendo Switch',
    'Nintendo DS',
    'Retro Consoles',
    'Handheld Consoles'
  ];

  const accessories = [
    'Controllers',
    'Chargers',
    'Cables',
    'Carrying Case',
    'Extra Joy-Con'
  ];

  const storageOptions = [
    '500GB',
    '1TB'
  ];

  const features = [
    'Rechargeable',
    'HDMI Output'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Console Model</label>
        <Autocomplete
          options={consoleModels}
          value={specs.gaming_consoleModel || ''}
          onChange={(_, newValue) => onChange('gaming_consoleModel', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select console model"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Included Accessories</label>
        <Autocomplete
          multiple
          options={accessories}
          value={specs.gaming_accessories || []}
          onChange={(_, newValue) => onChange('gaming_accessories', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select included accessories"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Storage Capacity</label>
        <Autocomplete
          options={storageOptions}
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
        <label className="block text-sm font-medium text-gray-700">Edition/Version</label>
        <TextField
          fullWidth
          placeholder="Enter edition or version (e.g., Slim, Pro)"
          value={specs.gaming_edition || ''}
          onChange={(e) => onChange('gaming_edition', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div className="space-y-2">
        <FormControlLabel
          control={
            <Checkbox
              checked={specs.gaming_bundled || false}
              onChange={(e) => onChange('gaming_bundled', e.target.checked)}
            />
          }
          label="Bundled with Games"
        />
      </div>
    </div>
  );
};

ConsoleSpecs.propTypes = {
  specs: PropTypes.shape({
    gaming_consoleModel: PropTypes.string,
    gaming_accessories: PropTypes.arrayOf(PropTypes.string),
    gaming_storageCapacity: PropTypes.string,
    gaming_features: PropTypes.arrayOf(PropTypes.string),
    gaming_edition: PropTypes.string,
    gaming_bundled: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

export default ConsoleSpecs; 