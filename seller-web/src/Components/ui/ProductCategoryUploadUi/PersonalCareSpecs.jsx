import { Autocomplete, TextField, FormControlLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';

const PersonalCareSpecs = ({ specs, onChange }) => {
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
    'Toothpaste',
    'Toothbrush',
    'Roll-On',
    'Spray',
    'Solid',
    'Sanitary Pads',
    'Tampons',
    'Menstrual Cups'
  ];

  const specialties = [
    'Whitening',
    'Sensitive'
  ];

  const sizes = [
    'Regular',
    'Overnight'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_personalCareType || []}
          onChange={(_, newValue) => onChange('healthBeauty_personalCareType', newValue)}
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
        <label className="block text-sm font-medium text-gray-700">Specialty</label>
        <Autocomplete
          multiple
          options={specialties}
          value={specs.healthBeauty_specialty || []}
          onChange={(_, newValue) => onChange('healthBeauty_specialty', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select specialties"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Size</label>
        <Autocomplete
          options={sizes}
          value={specs.healthBeauty_size || ''}
          onChange={(_, newValue) => onChange('healthBeauty_size', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select size"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Absorbency Level</label>
        <TextField
          fullWidth
          placeholder="Specify absorbency level"
          value={specs.healthBeauty_absorbencyLevel || ''}
          onChange={(e) => onChange('healthBeauty_absorbencyLevel', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div className="space-y-2">
        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_fluoride || false}
              onChange={(e) => onChange('healthBeauty_fluoride', e.target.checked)}
            />
          }
          label="Contains Fluoride"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={specs.healthBeauty_antiperspirant || false}
              onChange={(e) => onChange('healthBeauty_antiperspirant', e.target.checked)}
            />
          }
          label="Antiperspirant"
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

PersonalCareSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_personalCareType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_specialty: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_size: PropTypes.string,
    healthBeauty_absorbencyLevel: PropTypes.string,
    healthBeauty_fluoride: PropTypes.bool,
    healthBeauty_antiperspirant: PropTypes.bool,
    healthBeauty_scentFree: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired
};

export default PersonalCareSpecs; 