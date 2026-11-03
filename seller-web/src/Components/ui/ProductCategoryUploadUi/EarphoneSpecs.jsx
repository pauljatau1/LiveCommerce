import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const EarphoneSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Wired", value: "Wired" },
    { label: "Wireless", value: "Wireless" }
  ];

  const connectivityOptions = [
    { label: "Bluetooth", value: "Bluetooth" },
    { label: "3.5mm Jack", value: "3.5mm Jack" }
  ];

  const features = [
    "Noise-Cancelling",
    "In-Line Mic",
    "Water Resistant",
    "Touch Controls"
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
          value={typeOptions.find(type => type.value === specs.mobileAccessories_Type) || specs.mobileAccessories_Type || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Type', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type earphone type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Connectivity */}
      <div className="space-y-2">
        <Label>Connectivity</Label>
        <Autocomplete
          freeSolo
          options={connectivityOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={connectivityOptions.find(conn => conn.value === specs.mobileAccessories_Input) || specs.mobileAccessories_Input || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Input', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type connectivity type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label>Features</Label>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature) => (
            <label key={feature} className="flex items-center space-x-2">
              <Checkbox
                checked={specs.mobileAccessories_Features?.includes(feature)}
                onCheckedChange={(checked) => {
                  const currentFeatures = specs.mobileAccessories_Features?.split(',').filter(Boolean) || [];
                  const updatedFeatures = checked
                    ? [...currentFeatures, feature]
                    : currentFeatures.filter(f => f !== feature);
                  onChange('mobileAccessories_Features', updatedFeatures.join(','));
                }}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

EarphoneSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default EarphoneSpecs;
