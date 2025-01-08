import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const ProtectorSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    { label: "Tempered Glass", value: "Tempered Glass" },
    { label: "Plastic", value: "Plastic" }
  ];

  const features = [
    "Privacy",
    "Anti-Glare"
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
          value={materialOptions.find(mat => mat.value === specs.mobileAccessories_Material) || specs.mobileAccessories_Material || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Material', value);
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

ProtectorSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ProtectorSpecs;
