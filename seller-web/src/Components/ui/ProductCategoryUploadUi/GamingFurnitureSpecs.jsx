import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const GamingFurnitureSpecs = ({ specs, onChange }) => {
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

  const furnitureTypes = [
    'Gaming Desk',
    'Multi-Level Desk',
    'Gaming Chair',
    'Recliner',
    'Ergonomic Chair'
  ];

  const features = [
    'Cable Management',
    'Adjustable Height',
    'Lumbar Support',
    'Adjustable Armrests',
    'RGB Lighting',
    'Cup Holder',
    'Headrest',
    'Footrest',
    'Tilt Function'
  ];

  const materials = [
    'Metal',
    'Wood',
    'PU Leather',
    'Mesh',
    'Fabric'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Furniture Type</label>
        <Autocomplete
          multiple
          options={furnitureTypes}
          value={specs.gaming_furnitureType || []}
          onChange={(_, newValue) => onChange('gaming_furnitureType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select furniture type"
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
          value={specs.gaming_furnitureFeatures || []}
          onChange={(_, newValue) => onChange('gaming_furnitureFeatures', newValue)}
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
        <Autocomplete
          multiple
          options={materials}
          value={specs.gaming_furnitureMaterial || []}
          onChange={(_, newValue) => onChange('gaming_furnitureMaterial', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Weight Capacity (kg)</label>
        <TextField
          fullWidth
          type="number"
          placeholder="Enter weight capacity"
          value={specs.gaming_weightCapacity || ''}
          onChange={(e) => onChange('gaming_weightCapacity', e.target.value)}
          sx={inputStyles}
        />
      </div>
    </div>
  );
};

GamingFurnitureSpecs.propTypes = {
  specs: PropTypes.shape({
    gaming_furnitureType: PropTypes.arrayOf(PropTypes.string),
    gaming_furnitureFeatures: PropTypes.arrayOf(PropTypes.string),
    gaming_furnitureMaterial: PropTypes.arrayOf(PropTypes.string),
    gaming_weightCapacity: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired
};

export default GamingFurnitureSpecs; 