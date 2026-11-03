import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const BathBodySpecs = ({ specs, onChange }) => {
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
    'Shower Gel',
    'Soap Bar',
    'Body Lotion',
    'Body Butter',
    'Hand Cream',
    'Sanitizer'
  ];

  const keyIngredients = [
    'Shea Butter',
    'Aloe Vera'
  ];

  const keyBenefits = [
    'Hydrating',
    'Firming',
    'Moisturizing',
    'Anti-Bacterial'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_bathType || []}
          onChange={(_, newValue) => onChange('healthBeauty_bathType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Key Ingredients</label>
        <Autocomplete
          multiple
          options={keyIngredients}
          value={specs.healthBeauty_ingredients || []}
          onChange={(_, newValue) => onChange('healthBeauty_ingredients', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select key ingredients"
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

      <div className="space-y-2">
        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_scented || false}
              onChange={(e) => onChange('healthBeauty_scented', e.target.checked)}
            />
          }
          label="Scented"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_scentFree || false}
              onChange={(e) => onChange('healthBeauty_scentFree', e.target.checked)}
            />
          }
          label="Scent-Free"
        />
      </div>
    </div>
  );
};

BathBodySpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_bathType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_ingredients: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_benefits: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_scented: PropTypes.bool,
    healthBeauty_scentFree: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

export default BathBodySpecs; 