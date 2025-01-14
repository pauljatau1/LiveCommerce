import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const ExternalHDDSpecs = ({ specs, onChange }) => {
  const connectivityOptions = [
    { label: "USB 3.0", value: "USB 3.0" },
    { label: "USB-C", value: "USB-C" },
    { label: "Thunderbolt", value: "Thunderbolt" }
  ];

  const features = [
    "Portable",
    "Rugged"
  ];

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.5rem',
      height: '48px',
      '& fieldset': { borderColor: '#02020238' },
      '&:hover fieldset': { borderColor: '#02020238' },
      '&.Mui-focused fieldset': { borderColor: '#02020238' }
    },
    '& .MuiInputBase-input': {
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#64748b'
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage Capacity */}
      <div className="space-y-2">
        <Label>Storage Capacity (GB/TB)</Label>
        <Input
          type="text"
          placeholder="Enter storage capacity..."
          value={specs.computing_storage || ''}
          onChange={(e) => onChange('computing_storage', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Connectivity */}
      <div className="space-y-2">
        <Label>Connectivity</Label>
        <Autocomplete
          freeSolo
          multiple
          options={connectivityOptions.map((option) => option.label)}
          value={specs.computing_connectivity || []}
          onChange={(_, newValue) => {
            onChange('computing_connectivity', newValue);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select connectivity types..."
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
    </div>
  );
};

ExternalHDDSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ExternalHDDSpecs;
