import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const ScannerSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Flatbed", value: "Flatbed" },
    { label: "Document", value: "Document" },
    { label: "Portable", value: "Portable" }
  ];

  const connectivityOptions = [
    { label: "USB", value: "USB" },
    { label: "Wireless", value: "Wireless" }
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
              placeholder="Enter or select scanner type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <Label>Resolution (dpi)</Label>
        <Input
          type="text"
          placeholder="Enter resolution..."
          value={specs.computing_resolution || ''}
          onChange={(e) => onChange('computing_resolution', e.target.value)}
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
    </div>
  );
};

ScannerSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ScannerSpecs;
