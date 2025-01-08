import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import PropTypes from 'prop-types';

const PowerBankSpecs = ({ specs, onChange }) => {
  const capacityOptions = [
    { label: "10,000mAh", value: "10000mAh" },
    { label: "20,000mAh", value: "20000mAh" },
    { label: "Other", value: "Other" }
  ];

  const inputTypes = [
    { label: "USB-C", value: "USB-C" },
    { label: "Micro USB", value: "Micro USB" }
  ];

  const outputTypes = [
    { label: "USB-C", value: "USB-C" },
    { label: "USB-A", value: "USB-A" }
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
      {/* Capacity */}
      <div className="space-y-2">
        <Label>Capacity</Label>
        <Autocomplete
          freeSolo
          options={capacityOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={capacityOptions.find(cap => cap.value === specs.mobileAccessories_Capacity) || specs.mobileAccessories_Capacity || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Capacity', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type capacity..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Input Type */}
      <div className="space-y-2">
        <Label>Input Type</Label>
        <Autocomplete
          freeSolo
          options={inputTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={inputTypes.find(type => type.value === specs.mobileAccessories_Input) || specs.mobileAccessories_Input || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Input', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type input type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Output Type */}
      <div className="space-y-2">
        <Label>Output Type</Label>
        <Autocomplete
          freeSolo
          options={outputTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={outputTypes.find(type => type.value === specs.mobileAccessories_Output) || specs.mobileAccessories_Output || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Output', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type output type..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

PowerBankSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default PowerBankSpecs;
