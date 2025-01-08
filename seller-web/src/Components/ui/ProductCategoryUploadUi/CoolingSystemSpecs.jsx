import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const CoolingSystemSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Air", value: "Air" },
    { label: "Liquid", value: "Liquid" }
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
              placeholder="Enter or select cooling type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Compatibility */}
      <div className="space-y-2">
        <Label>Compatibility (Socket/Chipset)</Label>
        <Input
          type="text"
          placeholder="Enter compatibility..."
          value={specs.computing_compatibility || ''}
          onChange={(e) => onChange('computing_compatibility', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Noise Level */}
      <div className="space-y-2">
        <Label>Noise Level (dB)</Label>
        <Input
          type="text"
          placeholder="Enter noise level..."
          value={specs.computing_noiselevel || ''}
          onChange={(e) => onChange('computing_noiselevel', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

CoolingSystemSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default CoolingSystemSpecs;
