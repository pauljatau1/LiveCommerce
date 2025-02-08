import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const FragranceSpecs = ({ specs, onChange }) => {
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
    'Perfume',
    'Body Mist',
    'Cologne',
    'Body Spray'
  ];

  const scentFamilies = [
    'Floral',
    'Fruity',
    'Oriental',
    'Woody',
    'Spicy',
    'Citrus'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Product Type</label>
        <Autocomplete
          multiple
          options={productTypes}
          value={specs.healthBeauty_fragranceType || []}
          onChange={(_, newValue) => onChange('healthBeauty_fragranceType', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select fragrance types"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Scent Family</label>
        <Autocomplete
          multiple
          options={scentFamilies}
          value={specs.healthBeauty_scentFamily || []}
          onChange={(_, newValue) => onChange('healthBeauty_scentFamily', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select scent families"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Longevity (Hours)</label>
        <TextField
          fullWidth
          type="number"
          placeholder="Enter longevity in hours"
          value={specs.healthBeauty_longevity || ''}
          onChange={(e) => onChange('healthBeauty_longevity', e.target.value)}
          sx={inputStyles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Volume (mL)</label>
        <TextField
          fullWidth
          type="number"
          placeholder="Enter volume in mL"
          value={specs.healthBeauty_volume || ''}
          onChange={(e) => onChange('healthBeauty_volume', e.target.value)}
          sx={inputStyles}
        />
      </div>
    </div>
  );
};

FragranceSpecs.propTypes = {
  specs: PropTypes.shape({
    healthBeauty_fragranceType: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_scentFamily: PropTypes.arrayOf(PropTypes.string),
    healthBeauty_longevity: PropTypes.string,
    healthBeauty_volume: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired
};

export default FragranceSpecs; 