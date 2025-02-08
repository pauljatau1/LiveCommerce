import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const BathingSkinCareSpecs = ({ specs, onChange }) => {
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
    'Hooded Towels',
    'Bath Towels',
    'Baby Lotion',
    'Rash Cream',
    'Nail Clippers',
    'Brushes'
  ];

  const materials = [
    'Cotton',
    'Bamboo',
    'Plastic',
    'Stainless Steel'
  ];

  const ingredients = [
    'Hypoallergenic',
    'Fragrance-Free'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.baby_bathingProductType || []}
          onChange={(_, newValue) => onChange('baby_bathingProductType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select products"
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
        <label className="block text-sm font-medium text-gray-700">Ingredients</label>
        <Autocomplete
          multiple
          options={ingredients}
          value={specs.baby_ingredients || []}
          onChange={(_, newValue) => onChange('baby_ingredients', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select ingredients"
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

BathingSkinCareSpecs.propTypes = {
  specs: PropTypes.shape({
    baby_bathingProductType: PropTypes.arrayOf(PropTypes.string),
    baby_material: PropTypes.arrayOf(PropTypes.string),
    baby_ingredients: PropTypes.arrayOf(PropTypes.string)
  }),
  onChange: PropTypes.func.isRequired
};

export default BathingSkinCareSpecs; 