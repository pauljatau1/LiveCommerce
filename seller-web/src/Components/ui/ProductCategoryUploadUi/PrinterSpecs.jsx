import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const PrinterSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Inkjet", value: "Inkjet" },
    { label: "Laser", value: "Laser" }
  ];

  const features = [
    "All-in-One",
    "Wireless",
    "Duplex Printing"
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
              placeholder="Enter or select printer type..."
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

      {/* Print Speed */}
      <div className="space-y-2">
        <Label>Print Speed (ppm)</Label>
        <Input
          type="text"
          placeholder="Enter print speed..."
          value={specs.computing_printspeed || ''}
          onChange={(e) => onChange('computing_printspeed', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

PrinterSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default PrinterSpecs;
