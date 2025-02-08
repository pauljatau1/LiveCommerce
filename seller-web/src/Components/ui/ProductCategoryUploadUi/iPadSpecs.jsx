import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const iPadSpecs = ({ specs, onChange }) => {
  const modelOptions = [
    { label: "iPad Pro", value: "iPad Pro" },
    { label: "iPad Air", value: "iPad Air" },
    { label: "iPad Mini", value: "iPad Mini" }
  ];

  const storageOptions = [
    { label: "64GB", value: "64GB" },
    { label: "128GB", value: "128GB" },
    { label: "256GB", value: "256GB" },
    { label: "512GB", value: "512GB" },
    { label: "1TB", value: "1TB" }
  ];

  const connectivityOptions = [
    { label: "Wi-Fi", value: "Wi-Fi" },
    { label: "Wi-Fi + Cellular", value: "Wi-Fi + Cellular" }
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
      {/* Model */}
      <div className="space-y-2">
        <Label>Model</Label>
        <Autocomplete
          freeSolo
          options={modelOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={modelOptions.find(model => model.value === specs.tablets_models) || specs.tablets_models || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('tablets_models', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type iPad model..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Storage */}
      <div className="space-y-2">
        <Label>Storage Capacity</Label>
        <Autocomplete
          freeSolo
          options={storageOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={storageOptions.find(storage => storage.value === specs.tablets_storageCapacity) || specs.tablets_storageCapacity || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('tablets_storageCapacity', value);
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
          value={connectivityOptions.find(conn => conn.value === specs.tablets_Connectivity) || specs.tablets_Connectivity || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('tablets_Connectivity', value);
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
          value={specs.tablets_batteryLife || ''}
          onChange={(e) => onChange('tablets_batteryLife', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

iPadSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default iPadSpecs;
