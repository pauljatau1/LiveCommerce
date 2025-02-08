import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const BakewareSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    { label: "Aluminum", value: "Aluminum" },
    { label: "Non-Stick", value: "Non-Stick" },
    { label: "Silicone", value: "Silicone" },
    { label: "Steel", value: "Steel" }
  ];

  const shapeOptions = [
    { label: "Round", value: "Round" },
    { label: "Square", value: "Square" }
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
      {/* Material and Basic Info */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Material</Label>
          <Autocomplete
            freeSolo
            options={materialOptions}
            getOptionLabel={(option) => option.label || option}
            value={specs.kitchen_material || ''}
            onChange={(_, newValue) => 
              onChange('kitchen_material', typeof newValue === 'string' ? newValue : newValue?.value)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select material..."
                sx={inputStyles}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Size (inches)</Label>
          <Input
            type="number"
            placeholder="Enter size..."
            value={specs.kitchen_size || ''}
            onChange={(e) => onChange('kitchen_size', e.target.value)}
          />
        </div>
      </div>

      {/* Heat Resistance */}
      <div className="space-y-2">
        <Label>Heat Resistance</Label>
        <Input
          placeholder="E.g., 260°C/500°F"
          value={specs.kitchen_heatresistance || ''}
          onChange={(e) => onChange('kitchen_heatresistance', e.target.value)}
        />
      </div>

      {/* Special Features */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Number of Cups</Label>
          <Input
            type="number"
            placeholder="Enter number..."
            value={specs.kitchen_numberofcups || ''}
            onChange={(e) => onChange('kitchen_numberofcups', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Shape Type</Label>
          <Autocomplete
            options={shapeOptions}
            getOptionLabel={(option) => option.label}
            value={shapeOptions.find(opt => opt.value === specs.kitchen_shapetype) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_shapetype', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select shape..."
                sx={inputStyles}
              />
            )}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.kitchen_leakproof || false}
            onCheckedChange={(checked) => 
              onChange('kitchen_leakproof', checked)
            }
          />
          <Label>Leakproof</Label>
        </div>
      </div>
    </div>
  );
};

BakewareSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BakewareSpecs; 