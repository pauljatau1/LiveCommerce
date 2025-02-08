import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const VitaminsSupplementsSpecs = ({ specs, onChange }) => {
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
    'Multivitamins',
    'Probiotics',
    'Protein Powder',
    'BCAA'
  ];

  const formTypes = [
    'Tablet',
    'Capsule',
    'Gummy',
    'Powder'
  ];

  const benefits = [
    'Immune Support',
    'Energy Boost'
  ];

  const ingredients = [
    'Whey',
    'Plant-Based'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_supplementType || []}
          onChange={(_, newValue) => onChange('healthBeauty_supplementType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Form</label>
        <Autocomplete
          multiple
          options={formTypes}
          value={specs.healthBeauty_supplementForm || []}
          onChange={(_, newValue) => onChange('healthBeauty_supplementForm', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select forms"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Key Benefits</label>
        <Autocomplete
          multiple
          options={benefits}
          value={specs.healthBeauty_supplementBenefits || []}
          onChange={(_, newValue) => onChange('healthBeauty_supplementBenefits', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select benefits"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Flavor</label>
        <TextField
          fullWidth
          placeholder="Specify flavor"
          value={specs.healthBeauty_supplementFlavor || ''}
          onChange={(e) => onChange('healthBeauty_supplementFlavor', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ingredients</label>
        <Autocomplete
          multiple
          options={ingredients}
          value={specs.healthBeauty_supplementIngredients || []}
          onChange={(_, newValue) => onChange('healthBeauty_supplementIngredients', newValue)}
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

VitaminsSupplementsSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_supplementType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_supplementForm: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_supplementBenefits: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_supplementFlavor: PropTypes.string,
    healthBeauty_supplementIngredients: PropTypes.arrayOf(PropTypes.string)
  }),
  onChange: PropTypes.func.isRequired
};

export default VitaminsSupplementsSpecs; 