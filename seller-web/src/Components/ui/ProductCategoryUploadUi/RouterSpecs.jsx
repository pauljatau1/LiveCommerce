import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const RouterSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Wi-Fi 6", value: "Wi-Fi 6" },
    { label: "Dual-Band", value: "Dual-Band" },
    { label: "Gaming", value: "Gaming" }
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
          multiple
          options={typeOptions.map((option) => option.label)}
          value={specs.computing_type ? specs.computing_type.split(',') : []}
          onChange={(_, newValue) => {
            onChange('computing_type', newValue.join(','));
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select router types..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Coverage */}
      <div className="space-y-2">
        <Label>Coverage (sq. ft.)</Label>
        <Input
          type="text"
          placeholder="Enter coverage area..."
          value={specs.computing_coverage || ''}
          onChange={(e) => onChange('computing_coverage', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Speed */}
      <div className="space-y-2">
        <Label>Speed (Mbps)</Label>
        <Input
          type="text"
          placeholder="Enter speed..."
          value={specs.computing_speed || ''}
          onChange={(e) => onChange('computing_speed', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

RouterSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default RouterSpecs;
