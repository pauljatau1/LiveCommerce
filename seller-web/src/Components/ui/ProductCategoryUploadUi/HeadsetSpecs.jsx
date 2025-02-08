import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const HeadsetSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Wired", value: "Wired" },
    { label: "Wireless", value: "Wireless" }
  ];

  const features = [
    "Noise-Cancelling",
    "Surround Sound"
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
          options={typeOptions.map((option) => option.label)}
          value={specs.computing_type || ''}
          onChange={(_, newValue) => {
            onChange('computing_type', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select headset type..."
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
                checked={specs.computing_features?.includes(feature)}
                onCheckedChange={(checked) => {
                  const currentFeatures = specs.computing_features || [];
                  const updatedFeatures = checked
                    ? [...currentFeatures, feature]
                    : currentFeatures.filter(f => f !== feature);
                  onChange('computing_features', updatedFeatures);
                }}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Microphone */}
      <div className="space-y-2">
        <Label>Microphone</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.computing_microphone}
            onCheckedChange={(checked) => {
              onChange('computing_microphone', checked);
            }}
          />
          <span>Has microphone</span>
        </div>
      </div>
    </div>
  );
};

HeadsetSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default HeadsetSpecs;
