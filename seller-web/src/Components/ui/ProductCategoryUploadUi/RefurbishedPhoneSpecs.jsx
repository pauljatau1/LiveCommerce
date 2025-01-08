import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const RefurbishedPhoneSpecs = ({ specs, onChange }) => {
  const conditionTypes = [
    { label: "Refurbished", value: "Refurbished" },
    { label: "Like-New", value: "Like-New" },
  ];

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.5rem',
      height: '48px',
      '& fieldset': {
        borderColor: '#e2e8f0',
      },
      '&:hover fieldset': {
        borderColor: '#e2e8f0',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#05031F',
      }
    },
    '& .MuiInputBase-input': {
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#64748b',
    }
  };

  return (
    <div className="space-y-6">
      {/* Condition */}
      <div className="space-y-2">
        <Label>Condition</Label>
        <Autocomplete
          freeSolo
          options={conditionTypes}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={conditionTypes.find(type => type.value === specs.phones_condition) || specs.phones_condition || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('phones_condition', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type condition..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Warranty */}
      <div className="space-y-2">
        <Label>Warranty (Months)</Label>
        <Input
          type="number"
          placeholder="Specify warranty period..."
          value={specs.phones_warranty || ''}
          onChange={(e) => onChange('phones_warranty', e.target.value)}
          className="rounded-lg"
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
    </div>
  );
};

RefurbishedPhoneSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default RefurbishedPhoneSpecs;
