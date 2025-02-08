import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const HolderSpecs = ({ specs, onChange }) => {
  const typeOptions = [
    { label: "Car Mounts", value: "Car Mounts" },
    { label: "Desktop Stands", value: "Desktop Stands" },
    { label: "Tripod Stands", value: "Tripod Stands" }
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
          options={typeOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={typeOptions.find(type => type.value === specs.mobileAccessories_Type) || specs.mobileAccessories_Type || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('mobileAccessories_Type', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type holder type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Adjustable */}
      <div className="space-y-2">
        <Label>Adjustable</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.mobileAccessories_Adjustable}
            onCheckedChange={(checked) => {
              onChange('mobileAccessories_Adjustable', checked);
            }}
          />
          <span>Is adjustable</span>
        </div>
      </div>
    </div>
  );
};

HolderSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default HolderSpecs;
