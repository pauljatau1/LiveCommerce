import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const GraphicsCardSpecs = ({ specs, onChange }) => {
  const brandOptions = [
    { label: "NVIDIA", value: "NVIDIA" },
    { label: "AMD", value: "AMD" }
  ];

  const features = [
    "Ray Tracing",
    "DLSS"
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
      {/* Brand */}
      <div className="space-y-2">
        <Label>Brand</Label>
        <Autocomplete
          freeSolo
          options={brandOptions.map((option) => option.label)}
          value={specs.computing_brand || ''}
          onChange={(_, newValue) => {
            onChange('computing_brand', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select brand..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* VRAM */}
      <div className="space-y-2">
        <Label>VRAM (GB)</Label>
        <Input
          type="text"
          placeholder="Enter VRAM size..."
          value={specs.computing_vramsize || ''}
          onChange={(e) => onChange('computing_vramsize', e.target.value)}
          className="rounded-lg"
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

GraphicsCardSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default GraphicsCardSpecs;
