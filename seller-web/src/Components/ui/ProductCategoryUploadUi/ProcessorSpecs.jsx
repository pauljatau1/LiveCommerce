import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const ProcessorSpecs = ({ specs, onChange }) => {
  const brandOptions = [
    { label: "Intel", value: "Intel" },
    { label: "AMD", value: "AMD" }
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

      {/* Cores */}
      <div className="space-y-2">
        <Label>Number of Cores</Label>
        <Input
          type="number"
          placeholder="Enter number of cores..."
          value={specs.computing_cores || ''}
          onChange={(e) => onChange('computing_cores', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Clock Speed */}
      <div className="space-y-2">
        <Label>Clock Speed (GHz)</Label>
        <Input
          type="text"
          placeholder="Enter clock speed..."
          value={specs.computing_clockspeed || ''}
          onChange={(e) => onChange('computing_clockspeed', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

ProcessorSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ProcessorSpecs;
