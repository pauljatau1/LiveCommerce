import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const ToysPlaySpecs = ({ specs, onChange }) => {
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
    'Plush Toys',
    'Musical Toys',
    'Building Blocks',
    'Flash Cards',
    'Floating Toys',
    'Squeeze Toys'
  ];

  const materials = [
    'Polyester',
    'Cotton',
    'Plastic',
    'Rubber'
  ];

  const features = [
    'Interactive',
    'STEM-Based'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.baby_toyType || []}
          onChange={(_, newValue) => onChange('baby_toyType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select toy types"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Material</label>
        <Autocomplete
          multiple
          options={materials}
          value={specs.baby_material || []}
          onChange={(_, newValue) => onChange('baby_material', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select materials"
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
          value={specs.baby_toyFeatures || []}
          onChange={(_, newValue) => onChange('baby_toyFeatures', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select features"
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

ToysPlaySpecs.propTypes = {
  specs: PropTypes.shape({
    baby_toyType: PropTypes.arrayOf(PropTypes.string),
    baby_material: PropTypes.arrayOf(PropTypes.string),
    baby_toyFeatures: PropTypes.arrayOf(PropTypes.string)
  }),
  onChange: PropTypes.func.isRequired
};

export default ToysPlaySpecs; 