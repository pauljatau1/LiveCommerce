import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const FootCareSpecs = ({ specs, onChange }) => {
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
    'Epsom Salt',
    'Aromatherapy'
  ];

  const keyBenefits = [
    'Moisturizing',
    'Exfoliating',
    'Anti-Fungal',
    'Relaxation',
    'Detoxifying'
  ];

  const ingredients = [
    'Urea',
    'Aloe Vera'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_footCareType || []}
          onChange={(_, newValue) => onChange('healthBeauty_footCareType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Key Benefits</label>
        <Autocomplete
          multiple
          options={keyBenefits}
          value={specs.healthBeauty_benefits || []}
          onChange={(_, newValue) => onChange('healthBeauty_benefits', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select key benefits"
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
          value={specs.healthBeauty_ingredients || []}
          onChange={(_, newValue) => onChange('healthBeauty_ingredients', newValue)}
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

FootCareSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_footCareType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_benefits: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_ingredients: PropTypes.arrayOf(PropTypes.string)
  }),
  onChange: PropTypes.func.isRequired
};

export default FootCareSpecs; 