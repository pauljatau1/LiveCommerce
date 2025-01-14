import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const GamingDesktopSpecs = ({ specs, onChange }) => {
  const processorOptions = [
    { label: "Intel", value: "Intel" },
    { label: "AMD", value: "AMD" }
  ];

  const graphicsOptions = [
    { label: "NVIDIA", value: "NVIDIA" },
    { label: "AMD", value: "AMD" }
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
      {/* Processor */}
      <div className="space-y-2">
        <Label>Processor</Label>
        <Autocomplete
          freeSolo
          options={processorOptions.map((option) => option.label)}
          value={specs.computing_processor || ''}
          onChange={(_, newValue) => {
            onChange('computing_processor', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select processor type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Graphics */}
      <div className="space-y-2">
        <Label>Graphics</Label>
        <Autocomplete
          freeSolo
          options={graphicsOptions.map((option) => option.label)}
          value={specs.computing_graphics || ''}
          onChange={(_, newValue) => {
            onChange('computing_graphics', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select graphics type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* RAM */}
      <div className="space-y-2">
        <Label>RAM (GB)</Label>
        <Input
          type="text"
          placeholder="Enter RAM size..."
          value={specs.computing_ram || ''}
          onChange={(e) => onChange('computing_ram', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Storage */}
      <div className="space-y-2">
        <Label>Storage (GB/TB)</Label>
        <Input
          type="text"
          placeholder="Enter storage capacity..."
          value={specs.computing_storage || ''}
          onChange={(e) => onChange('computing_storage', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

GamingDesktopSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default GamingDesktopSpecs;
