import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const LaptopSpecs = ({ specs, onChange }) => {
  const processorOptions = [
    { label: "Intel Core i3", value: "Intel Core i3" },
    { label: "Intel Core i5", value: "Intel Core i5" },
    { label: "Intel Core i7", value: "Intel Core i7" },
    { label: "Intel Core i9", value: "Intel Core i9" },
    { label: "AMD Ryzen 3", value: "AMD Ryzen 3" },
    { label: "AMD Ryzen 5", value: "AMD Ryzen 5" },
    { label: "AMD Ryzen 7", value: "AMD Ryzen 7" },
    { label: "AMD Ryzen 9", value: "AMD Ryzen 9" }
  ];

  const ramOptions = [
    { label: "8GB", value: "8GB" },
    { label: "16GB", value: "16GB" },
    { label: "32GB", value: "32GB" },
    { label: "64GB", value: "64GB" }
  ];

  const storageOptions = [
    { label: "256GB SSD", value: "256GB SSD" },
    { label: "512GB SSD", value: "512GB SSD" },
    { label: "1TB SSD", value: "1TB SSD" },
    { label: "1TB HDD", value: "1TB HDD" },
    { label: "2TB HDD", value: "2TB HDD" }
  ];

  const osOptions = [
    { label: "Windows", value: "Windows" },
    { label: "macOS", value: "macOS" },
    { label: "Linux", value: "Linux" }
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
      {/* Screen Size */}
      <div className="space-y-2">
        <Label>Screen Size (inches)</Label>
        <Input
          type="number"
          placeholder="Enter screen size..."
          value={specs.computing_screensize || ''}
          onChange={(e) => onChange('computing_screensize', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Processor */}
      <div className="space-y-2">
        <Label>Processor</Label>
        <Autocomplete
          freeSolo
          options={processorOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={processorOptions.find(proc => proc.value === specs.computing_processor) || specs.computing_processor || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('computing_processor', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type processor..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* RAM */}
      <div className="space-y-2">
        <Label>RAM</Label>
        <Autocomplete
          freeSolo
          options={ramOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={ramOptions.find(ram => ram.value === specs.computing_ram) || specs.computing_ram || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('computing_ram', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type RAM..."
              sx={inputStyles}
            />
          )}
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
          value={storageOptions.find(storage => storage.value === specs.computing_storage) || specs.computing_storage || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('computing_storage', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type storage..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Operating System */}
      <div className="space-y-2">
        <Label>Operating System</Label>
        <Autocomplete
          freeSolo
          options={osOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={osOptions.find(os => os.value === specs.computing_operatingsystem) || specs.computing_operatingsystem || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('computing_operatingsystem', value);
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

      {/* Touchscreen */}
      <div className="space-y-2">
        <Label>Touchscreen</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.computing_touchscreen}
            onCheckedChange={(checked) => {
              onChange('computing_touchscreen', checked);
            }}
          />
          <span>Has touchscreen</span>
        </div>
      </div>

      {/* Battery Life */}
      <div className="space-y-2">
        <Label>Battery Life (Hours)</Label>
        <Input
          type="number"
          placeholder="Enter battery life..."
          value={specs.computing_batterylife || ''}
          onChange={(e) => onChange('computing_batterylife', e.target.value)}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

LaptopSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default LaptopSpecs;
