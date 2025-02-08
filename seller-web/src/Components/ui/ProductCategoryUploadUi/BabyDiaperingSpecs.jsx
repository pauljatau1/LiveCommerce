import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import PropTypes from 'prop-types';

const BabyDiaperingSpecs = ({ specs, onChange }) => {
  const diaperTypeOptions = ['Newborn', 'Regular', 'Overnight', 'All-in-One', 'Pocket Diapers'];
  const absorptionOptions = ['High', 'Medium'];
  const bagTypeOptions = ['Backpacks', 'Tote Bags'];
  const wipeTypeOptions = ['Wet Wipes', 'Reusable Wipes'];
  const materialOptions = ['Cotton', 'Bamboo', 'Biodegradable', 'Non-Woven', 'Foam', 'Plastic'];
  const closureOptions = ['Velcro', 'Snaps'];
  const featureOptions = ['Waterproof', 'Multiple Compartments'];

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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Diaper Type</Label>
          <Autocomplete
            multiple
            options={diaperTypeOptions}
            value={specs.baby_diaperType || []}
            onChange={(_, newValues) => onChange('baby_diaperType', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select types" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Absorption Level</Label>
          <Autocomplete
            options={absorptionOptions}
            value={specs.baby_absorption || ''}
            onChange={(_, newValue) => onChange('baby_absorption', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select absorption" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Materials</Label>
          <Autocomplete
            multiple
            options={materialOptions}
            value={specs.baby_material || []}
            onChange={(_, newValues) => onChange('baby_material', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select materials" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Closure Type</Label>
          <Autocomplete
            multiple
            options={closureOptions}
            value={specs.baby_closure || []}
            onChange={(_, newValues) => onChange('baby_closure', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select closures" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Bag Type</Label>
          <Autocomplete
            multiple
            options={bagTypeOptions}
            value={specs.baby_bagType || []}
            onChange={(_, newValues) => onChange('baby_bagType', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select bag types" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Wipe Type</Label>
          <Autocomplete
            multiple
            options={wipeTypeOptions}
            value={specs.baby_wipeType || []}
            onChange={(_, newValues) => onChange('baby_wipeType', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select wipe types" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Special Features</Label>
        <Autocomplete
          multiple
          options={featureOptions}
          value={specs.baby_features || []}
          onChange={(_, newValues) => onChange('baby_features', newValues)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Select features" sx={inputStyles} />
          )}
        />
      </div>
    </div>
  );
};

BabyDiaperingSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BabyDiaperingSpecs; 