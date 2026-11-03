import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const SmartPhoneSpecs = ({ specs, onChange }) => {
  const operatingSystems = [
    { label: "Android", value: "android" },
    { label: "iOS", value: "ios" },
  ];

  const storageOptions = [
    { label: "64GB", value: "64GB" },
    { label: "128GB", value: "128GB" },
    { label: "256GB", value: "256GB" },
    { label: "Other", value: "Other" },
  ];

  const cameraOptions = [
    { label: "Single", value: "Single" },
    { label: "Dual", value: "Dual" },
    { label: "Triple", value: "Triple" },
    { label: "Quad", value: "Quad" },
  ];

  const simTypes = [
    { label: "Single SIM", value: "Single SIM" },
    { label: "Dual SIM", value: "Dual SIM" },
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
      {/* Operating System */}
      <div className="space-y-2">
        <Label>Operating System</Label>
        <Autocomplete
          freeSolo
          options={operatingSystems}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={operatingSystems.find(os => os.value === specs.phones_operatingsystem) || specs.phones_operatingsystem || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_operatingsystem', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type operating system..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Screen Size */}
      <div className="space-y-2">
        <Label>Screen Size (inches)</Label>
        <Input
          type="number"
          step="0.1"
          placeholder="Specify screen size..."
          value={specs.phones_screensize || ''}
          onChange={(e) => onChange('phones_screensize', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Storage Capacity */}
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
          value={storageOptions.find(storage => storage.value === specs.phones_storagecapacity) || specs.phones_storagecapacity || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_storagecapacity', value);
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

      {/* Camera */}
      <div className="space-y-2">
        <Label>Camera</Label>
        <Autocomplete
          freeSolo
          options={cameraOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={cameraOptions.find(camera => camera.value === specs.phones_camera) || specs.phones_camera || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_camera', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type camera type..."
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
        <div className="flex flex-wrap gap-2">
          {['4G', '5G', 'Wi-Fi 6'].map((type) => (
            <label key={type} className="flex items-center space-x-2">
              <Checkbox
                checked={specs.phones_connectivity === type}
                onCheckedChange={(checked) => {
                  onChange('phones_connectivity', checked ? type : '');
                }}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
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

SmartPhoneSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default SmartPhoneSpecs;