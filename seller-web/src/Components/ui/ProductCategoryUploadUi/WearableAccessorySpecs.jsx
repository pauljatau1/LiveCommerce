import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import PropTypes from 'prop-types';

const WearableAccessorySpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Extra Bands", value: "Extra Bands" },
    { label: "Charging Docks", value: "Charging Docks" }
  ];

  const materialOptions = [
    { label: "Silicone", value: "Silicone" },
    { label: "Leather", value: "Leather" },
    { label: "Metal", value: "Metal" }
  ];

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
      {/* Type */}
      <div className="space-y-2">
        <Label>Type</Label>
        <Autocomplete
          freeSolo
          options={typeOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={typeOptions.find(type => type.value === specs.wearable_Type) || specs.wearable_Type || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('wearable_Type', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type accessory type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Material */}
      <div className="space-y-2">
        <Label>Material</Label>
        <Autocomplete
          freeSolo
          options={materialOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={materialOptions.find(mat => mat.value === specs.wearable_Material) || specs.wearable_Material || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('wearable_Material', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type material..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

WearableAccessorySpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default WearableAccessorySpecs;
