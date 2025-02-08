import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const SkinCareSpecs = ({ specs, onChange }) => {
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
    'Foaming Cleanser',
    'Gel Cleanser',
    'Oil-Based Cleanser',
    'Day Cream',
    'Night Cream'
  ];

  const skinTypes = [
    'Dry',
    'Oily',
    'Combination'
  ];

  const keyBenefits = [
    'Hydrating',
    'Acne Control',
    'Brightening',
    'Anti-Aging',
    'Firming'
  ];

  const keyIngredients = [
    'Vitamin C',
    'Hyaluronic Acid',
    'Retinol',
    'Peptides'
  ];

  const usageTime = [
    'Morning',
    'Night'
  ];

  const spfLevels = [
    '15',
    '30',
    '50'
  ];

  const spfTypes = [
    'Mineral',
    'Chemical'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_skinCareType || []}
          onChange={(_, newValue) => onChange('healthBeauty_skinCareType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Skin Type</label>
        <Autocomplete
          multiple
          options={skinTypes}
          value={specs.healthBeauty_skinType || []}
          onChange={(_, newValue) => onChange('healthBeauty_skinType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select skin types"
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
              placeholder="Select benefits"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Key Ingredients</label>
        <Autocomplete
          multiple
          freeSolo
          options={keyIngredients}
          value={specs.healthBeauty_ingredients || []}
          onChange={(_, newValue) => onChange('healthBeauty_ingredients', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select or enter ingredients"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Usage Time</label>
        <Autocomplete
          multiple
          options={usageTime}
          value={specs.healthBeauty_usageTime || []}
          onChange={(_, newValue) => onChange('healthBeauty_usageTime', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select usage time"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">SPF Level</label>
        <Autocomplete
          options={spfLevels}
          value={specs.healthBeauty_spfLevel || ''}
          onChange={(_, newValue) => onChange('healthBeauty_spfLevel', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select SPF level"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">SPF Type</label>
        <Autocomplete
          options={spfTypes}
          value={specs.healthBeauty_spfType || ''}
          onChange={(_, newValue) => onChange('healthBeauty_spfType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select SPF type"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_spf || false}
              onChange={(e) => onChange('healthBeauty_spf', e.target.checked)}
            />
          }
          label="Contains SPF"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_waterResistant || false}
              onChange={(e) => onChange('healthBeauty_waterResistant', e.target.checked)}
            />
          }
          label="Water Resistant"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_tinted || false}
              onChange={(e) => onChange('healthBeauty_tinted', e.target.checked)}
            />
          }
          label="Tinted"
        />
      </div>
    </div>
  );
};

SkinCareSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_skinCareType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_skinType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_benefits: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_ingredients: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_usageTime: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_spfLevel: PropTypes.string,
    healthBeauty_spfType: PropTypes.string,
    healthBeauty_spf: PropTypes.bool,
    healthBeauty_waterResistant: PropTypes.bool,
    healthBeauty_tinted: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

export default SkinCareSpecs; 