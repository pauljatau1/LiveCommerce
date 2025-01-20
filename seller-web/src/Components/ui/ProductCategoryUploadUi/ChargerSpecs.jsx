import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import PropTypes from 'prop-types';
const ChargerSpecs = ({ specs, onChange }) => {
  const chargerTypes = [
    { label: "Fast Chargers", value: "Fast Chargers" },
    { label: "Wireless Chargers", value: "Wireless Chargers" },
    { label: "Car Chargers", value: "Car Chargers" }
  ];

  const outputOptions = [
    { label: "20W", value: "20W" },
    { label: "65W", value: "65W" }
  ];

  const connectorTypes = [
    { label: "USB-C", value: "USB-C" },
    { label: "Lightning", value: "Lightning" }
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
      {/* Charger Type */}
      <div className="space-y-2">
        <Label>Charger Type</Label>
        <Autocomplete
          freeSolo
          options={chargerTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={chargerTypes.find(type => type.value === specs.mobileAccessories_Type) || specs.mobileAccessories_Type || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Type', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type charger type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Output Power */}
      <div className="space-y-2">
        <Label>Output Power</Label>
        <Autocomplete
          freeSolo
          options={outputOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={outputOptions.find(output => output.value === specs.mobileAccessories_Output) || specs.mobileAccessories_Output || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Output', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type output power..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Connector Type */}
      <div className="space-y-2">
        <Label>Connector Type</Label>
        <Autocomplete
          freeSolo
          options={connectorTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={connectorTypes.find(connector => connector.value === specs.mobileAccessories_Connector) || specs.mobileAccessories_Connector || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Connector', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type connector type..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

ChargerSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ChargerSpecs;
