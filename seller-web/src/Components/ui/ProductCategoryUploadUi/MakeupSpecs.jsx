import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const MakeupSpecs = ({ specs, onChange }) => {
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
    'Foundation',
    'Concealer',
    'Primer',
    'Eyeshadow Palette',
    'Single Eyeshadow',
    'Eyeliner',
    'Lipstick',
    'Lip Gloss',
    'Lip Liner',
    'Nail Polish'
  ];

  const finishTypes = [
    'Matte',
    'Dewy',
    'Glitter',
    'Satin',
    'Glossy'
  ];

  const skinTypes = [
    'Dry',
    'Oily',
    'Combination'
  ];

  const coverageTypes = [
    'Full',
    'Medium',
    'Light'
  ];

  const applicatorTypes = [
    'Brush',
    'Felt-Tip'
  ];

  const keyIngredients = [
    'Hyaluronic Acid',
    'Vitamin E'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_makeupType || []}
          onChange={(_, newValue) => onChange('healthBeauty_makeupType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Shade</label>
        <TextField
          fullWidth
          placeholder="Specify shade"
          value={specs.healthBeauty_shade || ''}
          onChange={(e) => onChange('healthBeauty_shade', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Coverage</label>
        <Autocomplete
          multiple
          options={coverageTypes}
          value={specs.healthBeauty_coverage || []}
          onChange={(_, newValue) => onChange('healthBeauty_coverage', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select coverage types"
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
        <label className="block text-sm font-medium text-gray-700">Finish</label>
        <Autocomplete
          multiple
          options={finishTypes}
          value={specs.healthBeauty_finish || []}
          onChange={(_, newValue) => onChange('healthBeauty_finish', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select finish types"
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
        <label className="block text-sm font-medium text-gray-700">Applicator Type</label>
        <Autocomplete
          multiple
          options={applicatorTypes}
          value={specs.healthBeauty_applicatorType || []}
          onChange={(_, newValue) => onChange('healthBeauty_applicatorType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select applicator types"
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
          label="SPF Protection"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_crueltyFree || false}
              onChange={(e) => onChange('healthBeauty_crueltyFree', e.target.checked)}
            />
          }
          label="Cruelty-Free"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_waterproof || false}
              onChange={(e) => onChange('healthBeauty_waterproof', e.target.checked)}
            />
          }
          label="Waterproof"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_longLasting || false}
              onChange={(e) => onChange('healthBeauty_longLasting', e.target.checked)}
            />
          }
          label="Long-Lasting"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_quickDry || false}
              onChange={(e) => onChange('healthBeauty_quickDry', e.target.checked)}
            />
          }
          label="Quick-Dry"
        />
      </div>
    </div>
  );
};

MakeupSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_makeupType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_shade: PropTypes.string,
    healthBeauty_coverage: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_skinType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_finish: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_ingredients: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_applicatorType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_spf: PropTypes.bool,
    healthBeauty_crueltyFree: PropTypes.bool,
    healthBeauty_waterproof: PropTypes.bool,
    healthBeauty_longLasting: PropTypes.bool,
    healthBeauty_quickDry: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

export default MakeupSpecs; 