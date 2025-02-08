import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const CookwareSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    { label: "Non-Stick", value: "Non-Stick" },
    { label: "Stainless Steel", value: "Stainless Steel" },
    { label: "Cast Iron", value: "Cast Iron" },
    { label: "Aluminum", value: "Aluminum" },
    { label: "Copper", value: "Copper" },
    { label: "Carbon Steel", value: "Carbon Steel" },
    { label: "Enameled Cast Iron", value: "Enameled Cast Iron" }
  ];

  const handleTypeOptions = [
    { label: "Wooden", value: "Wooden" },
    { label: "Steel", value: "Steel" }
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
      {/* Primary Material */}
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

      {/* Size and Capacity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Size (inches)</Label>
          <Input
            type="number"
            placeholder="Enter size..."
            value={specs.kitchen_size || ''}
            onChange={(e) => onChange('kitchen_size', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Capacity (liters)</Label>
          <Input
            type="number"
            placeholder="Enter capacity..."
            value={specs.kitchen_capacity || ''}
            onChange={(e) => onChange('kitchen_capacity', e.target.value)}
          />
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Handle Type</Label>
          <Autocomplete
            options={handleTypeOptions}
            getOptionLabel={(option) => option.label}
            value={handleTypeOptions.find(opt => opt.value === specs.kitchen_handletype) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_handletype', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select handle type..."
                sx={inputStyles}
              />
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={specs.kitchen_inductioncompatible || false}
              onCheckedChange={(checked) => 
                onChange('kitchen_inductioncompatible', checked)
              }
            />
            <Label>Induction Compatible</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={specs.kitchen_lidincluded || false}
              onCheckedChange={(checked) => 
                onChange('kitchen_lidincluded', checked)
              }
            />
            <Label>Lid Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={specs.kitchen_ovensafe || false}
              onCheckedChange={(checked) => 
                onChange('kitchen_ovensafe', checked)
              }
            />
            <Label>Oven-Safe</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

CookwareSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default CookwareSpecs; 