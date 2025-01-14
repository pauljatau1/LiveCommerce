import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const AndroidTabletSpecs = ({ specs, onChange }) => {
  const connectivityOptions = [
    { label: "Wi-Fi", value: "Wi-Fi" },
    { label: "Cellular", value: "Cellular" },
    { label: "Wi-Fi + Cellular", value: "Wi-Fi + Cellular" }
  ];

  const storageOptions = [
    { label: "32GB", value: "32GB" },
    { label: "64GB", value: "64GB" },
    { label: "128GB", value: "128GB" },
    { label: "256GB", value: "256GB" }
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
      {/* Screen Size */}
      <div className="space-y-2">
        <Label>Screen Size (inches)</Label>
        <Input
          type="number"
          placeholder="Enter screen size..."
          value={specs.tablets_screensize || ''}
          onChange={(e) => onChange('tablets_screensize', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Storage */}
      <div className="space-y-2">
        <Label>Storage</Label>
        <Autocomplete
          freeSolo
          options={storageOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={storageOptions.find(storage => storage.value === specs.tablets_storage) || specs.tablets_storage || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('tablets_storage', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type storage capacity..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Connectivity */}
      <div className="space-y-2">
        <Label>Connectivity</Label>
        <Autocomplete
          freeSolo
          options={connectivityOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={connectivityOptions.find(conn => conn.value === specs.tablets_connectivity) || specs.tablets_connectivity || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('tablets_connectivity', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type connectivity type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Battery Life */}
      <div className="space-y-2">
        <Label>Battery Life (Hours)</Label>
        <Input
          type="number"
          placeholder="Enter battery life..."
          value={specs.tablets_batterylife || ''}
          onChange={(e) => onChange('tablets_batterylife', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

AndroidTabletSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default AndroidTabletSpecs;
