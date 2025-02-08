import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';


const USBFlashSpecs = ({ specs, onChange }) => {
  const connectivityOptions = [
    { label: "USB 2.0", value: "USB 2.0" },
    { label: "USB 3.0", value: "USB 3.0" },
    { label: "USB-C", value: "USB-C" }
  ];

  const securityOptions = [
    { label: "Encryption", value: "Encryption" },
    { label: "Password Protection", value: "Password Protection" }
  ];

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.5rem',
      minHeight: '48px',
      height: 'auto',
      '& fieldset': { borderColor: '#02020238' },
      '&:hover fieldset': { borderColor: '#02020238' },
      '&.Mui-focused fieldset': { borderColor: '#02020238' }
    },
    '& .MuiInputBase-input': {
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#64748b',
      height: 'auto',
      minHeight: '1.4375em'
    },
    '& .MuiAutocomplete-tag': {
      margin: '3px'
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

      {/* Security Features */}
      <div className="space-y-2">
        <Label>Security Features</Label>
        <Autocomplete
          freeSolo
          multiple
          options={securityOptions.map((option) => option.label)}
          value={specs.computing_security ? specs.computing_security.split(',') : []}
          onChange={(_, newValue) => {
            onChange('computing_security', newValue.join(','));
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select security features..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

USBFlashSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default USBFlashSpecs;
