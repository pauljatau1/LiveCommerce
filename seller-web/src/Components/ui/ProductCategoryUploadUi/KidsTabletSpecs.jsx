import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const KidsTabletSpecs = ({ specs, onChange }) => {
  const durabilityOptions = [
    { label: "Rugged", value: "Rugged" },
    { label: "Standard", value: "Standard" }
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
      {/* Durability */}
      <div className="space-y-2">
        <Label>Durability</Label>
        <Autocomplete
          freeSolo
          options={durabilityOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          value={durabilityOptions.find(type => type.value === specs.tablets_Durability) || specs.tablets_Durability || null}
          onChange={(_, newValue) => {
            const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
            onChange('tablets_Durability', value);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Select or type durability type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Parental Controls */}
      <div className="space-y-2">
        <Label>Parental Controls</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.tablets_ParentalControls}
            onCheckedChange={(checked) => {
              onChange('tablets_ParentalControls', checked);
            }}
          />
          <span>Has parental controls</span>
        </div>
      </div>

      {/* Pre-installed Apps */}
      <div className="space-y-2">
        <Label>Pre-installed Apps</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.tablets_PreinstalledApps}
            onCheckedChange={(checked) => {
              onChange('tablets_PreinstalledApps', checked);
            }}
          />
          <span>Includes pre-installed apps</span>
        </div>
      </div>
    </div>
  );
};

KidsTabletSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default KidsTabletSpecs;
