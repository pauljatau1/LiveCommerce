import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const SmartwatchSpecs = ({ specs, onChange }) => {
  const connectivityOptions = [
    { label: "Bluetooth", value: "Bluetooth" },
    { label: "Wi-Fi", value: "Wi-Fi" }
  ];

  const features = [
    "Fitness Trackers",
    "GPS",
    "Heart Rate Monitoring"
  ];

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.5rem',
      height: '48px',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#e2e8f0' },
      '&.Mui-focused fieldset': { borderColor: '#05031F' }
    },
    '& .MuiInputBase-input': {
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#64748b'
    }
  };

  return (
    <div className="space-y-6">
      {/* Features */}
      <div className="space-y-2">
        <Label>Features</Label>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature) => (
            <label key={feature} className="flex items-center space-x-2">
              <Checkbox
                checked={specs.wearable_Features?.includes(feature)}
                onCheckedChange={(checked) => {
                  const currentFeatures = specs.wearable_Features?.split(',').filter(Boolean) || [];
                  const updatedFeatures = checked
                    ? [...currentFeatures, feature]
                    : currentFeatures.filter(f => f !== feature);
                  onChange('wearable_Features', updatedFeatures.join(','));
                }}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
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
          value={connectivityOptions.find(conn => conn.value === specs.wearable_Connectivity) || specs.wearable_Connectivity || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('wearable_Connectivity', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type connectivity..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

SmartwatchSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default SmartwatchSpecs;
