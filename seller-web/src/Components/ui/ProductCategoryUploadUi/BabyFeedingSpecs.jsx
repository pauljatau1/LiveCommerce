import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import PropTypes from 'prop-types';

const BabyFeedingSpecs = ({ specs, onChange }) => {
  const feedingTypeOptions = ['Breast Pumps', 'Nursing Pads', 'Pacifiers', 'Clips', 'Holders'];
  const productTypeOptions = ['Baby Bottles', 'Bottle Warmers', 'Spoons', 'Forks', 'Plates', 'Bibs'];
  const materialOptions = ['Silicone', 'Cotton', 'Glass', 'Plastic', 'Rubber', 'BPA-Free', 'Stainless Steel'];
  const featureOptions = ['BPA-Free'];

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1  gap-4">
        <div className="space-y-2">
          <Label>Feeding Type</Label>
          <Autocomplete
            multiple
            options={feedingTypeOptions}
            value={specs.baby_feedingType || []}
            onChange={(_, newValues) => onChange('baby_feedingType', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select types" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Product Type</Label>
          <Autocomplete
            multiple
            options={productTypeOptions}
            value={specs.baby_feedingProductType || []}
            onChange={(_, newValues) => onChange('baby_feedingProductType', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select products" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Materials</Label>
          <Autocomplete
            multiple
            options={materialOptions}
            value={specs.baby_material || []}
            onChange={(_, newValues) => onChange('baby_material', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select materials" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Capacity</Label>
          <TextField
            fullWidth
            value={specs.baby_capacity || ''}
            onChange={(e) => onChange('baby_capacity', e.target.value)}
            placeholder="Enter capacity (e.g., 250ml)"
            sx={inputStyles}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Safety Features</Label>
        <Autocomplete
          multiple
          options={featureOptions}
          value={specs.baby_features || []}
          onChange={(_, newValues) => onChange('baby_features', newValues)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Select features" sx={inputStyles} />
          )}
        />
      </div>
    </div>
  );
};

BabyFeedingSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BabyFeedingSpecs; 