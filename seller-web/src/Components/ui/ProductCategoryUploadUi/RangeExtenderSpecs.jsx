import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';
const RangeExtenderSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Wi-Fi", value: "Wi-Fi" },
    { label: "Powerline", value: "Powerline" }
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
              placeholder="Enter or select extender type..."
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

RangeExtenderSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default RangeExtenderSpecs;
