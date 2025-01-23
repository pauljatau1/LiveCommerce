import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const FeaturePhoneSpecs = ({ specs, onChange }) => {
  const screenTypes = [
    { label: "TFT", value: "TFT" },
    { label: "LCD", value: "LCD" },
  ];

  const connectivityTypes = [
    { label: "2G", value: "2G" },
    { label: "3G", value: "3G" },
  ];

  const simTypes = [
    { label: "Single SIM", value: "Single SIM" },
    { label: "Dual SIM", value: "Dual SIM" },
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
      color: '#64748b',
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen Type */}
      <div className="space-y-2">
        <Label>Screen Type</Label>
        <Autocomplete
          freeSolo
          options={screenTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={screenTypes.find(type => type.value === specs.phones_screensize) || specs.phones_screensize || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_screensize', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type screen type..."
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
          placeholder="Specify battery life..."
          value={specs.phones_batterylife || ''}
          onChange={(e) => onChange('phones_batterylife', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Connectivity */}
      <div className="space-y-2">
        <Label>Connectivity</Label>
        <Autocomplete
          freeSolo
          options={connectivityTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={connectivityTypes.find(type => type.value === specs.phones_connectivity || []) || specs.phones_connectivity || []}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_connectivity', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type connectivity..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* SIM Type */}
      <div className="space-y-2">
        <Label>SIM Type</Label>
        <Autocomplete
          freeSolo
          options={simTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={simTypes.find(sim => sim.value === specs.phones_simtype) || specs.phones_simtype || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_simtype', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type SIM type..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

FeaturePhoneSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default FeaturePhoneSpecs;