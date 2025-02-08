import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const SpaRelaxationSpecs = ({ specs, onChange }) => {
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

  const productTypes = [
    'Handheld',
    'Electric',
    'Essential Oils',
    'Diffusers'
  ];

  const features = [
    'Heat-Enabled',
    'Vibration'
  ];

  const scentFamilies = [
    'Relaxation',
    'Focus'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_spaType || []}
          onChange={(_, newValue) => onChange('healthBeauty_spaType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select product types"
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
          value={specs.healthBeauty_features || []}
          onChange={(_, newValue) => onChange('healthBeauty_features', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Material</label>
        <TextField
          fullWidth
          placeholder="Specify material"
          value={specs.healthBeauty_material || ''}
          onChange={(e) => onChange('healthBeauty_material', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Scent Family</label>
        <Autocomplete
          multiple
          options={scentFamilies}
          value={specs.healthBeauty_scentFamily || []}
          onChange={(_, newValue) => onChange('healthBeauty_scentFamily', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select scent families"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Usage</label>
        <TextField
          fullWidth
          placeholder="Specify usage"
          value={specs.healthBeauty_usage || ''}
          onChange={(e) => onChange('healthBeauty_usage', e.target.value)}
          sx={inputStyles}
        />
      </div>
    </div>
  );
};

SpaRelaxationSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_spaType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_features: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_material: PropTypes.string,
    healthBeauty_scentFamily: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_usage: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired
};

export default SpaRelaxationSpecs; 