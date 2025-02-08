import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const HairCareSpecs = ({ specs, onChange }) => {
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

  const hairTypes = [
    'Dry',
    'Oily',
    'Curly'
  ];

  const productTypes = [
    'Leave-In',
    'Deep Conditioner',
    'Gel',
    'Spray',
    'Straightener',
    'Curler',
    'Dryer'
  ];

  const keyBenefits = [
    'Volumizing',
    'Hydrating',
    'Repairing',
    'Strengthening'
  ];

  const holdLevels = [
    'Strong',
    'Medium',
    'Light'
  ];

  const materials = [
    'Ceramic',
    'Titanium'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_hairProductType || []}
          onChange={(_, newValue) => onChange('healthBeauty_hairProductType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Hair Type</label>
        <Autocomplete
          multiple
          options={hairTypes}
          value={specs.healthBeauty_hairType || []}
          onChange={(_, newValue) => onChange('healthBeauty_hairType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select hair types"
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
        <label className="block text-sm font-medium text-gray-700">Hold Level</label>
        <Autocomplete
          options={holdLevels}
          value={specs.healthBeauty_holdLevel || ''}
          onChange={(_, newValue) => onChange('healthBeauty_holdLevel', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select hold level"
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
          value={specs.healthBeauty_material || []}
          onChange={(_, newValue) => onChange('healthBeauty_material', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Heat Settings</label>
        <TextField
          fullWidth
          placeholder="Specify heat settings"
          value={specs.healthBeauty_heatSettings || ''}
          onChange={(e) => onChange('healthBeauty_heatSettings', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Voltage Compatibility</label>
        <TextField
          fullWidth
          placeholder="Specify voltage compatibility"
          value={specs.healthBeauty_voltage || ''}
          onChange={(e) => onChange('healthBeauty_voltage', e.target.value)}
          sx={inputStyles}
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
              checked={specs.healthBeauty_crueltyFree || false}
              onChange={(e) => onChange('healthBeauty_crueltyFree', e.target.checked)}
            />
          }
          label="Cruelty-Free"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_heatProtection || false}
              onChange={(e) => onChange('healthBeauty_heatProtection', e.target.checked)}
            />
          }
          label="Heat Protection"
        />
      </div>
    </div>
  );
};

HairCareSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_hairProductType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_hairType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_benefits: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_holdLevel: PropTypes.string,
    healthBeauty_material: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_heatSettings: PropTypes.string,
    healthBeauty_voltage: PropTypes.string,
    healthBeauty_scented: PropTypes.bool,
    healthBeauty_crueltyFree: PropTypes.bool,
    healthBeauty_heatProtection: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

export default HairCareSpecs; 