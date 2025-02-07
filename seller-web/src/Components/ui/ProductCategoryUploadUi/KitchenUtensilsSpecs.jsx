import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const KitchenUtensilsSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    { label: "Wood", value: "Wood" },
    { label: "Silicone", value: "Silicone" },
    { label: "Stainless Steel", value: "Stainless Steel" },
    { label: "Metal", value: "Metal" },
    { label: "Plastic", value: "Plastic" },
    { label: "Ceramic", value: "Ceramic" }
  ];

  const utensilTypeOptions = [
    { label: "Flat", value: "Flat" },
    { label: "Slotted", value: "Slotted" },
    { label: "Y-Shaped", value: "Y-Shaped" },
    { label: "Straight", value: "Straight" },
    { label: "Box", value: "Box" },
    { label: "Handheld", value: "Handheld" }
  ];

  const bladeTypeOptions = [
    { label: "Coarse", value: "Coarse" },
    { label: "Fine", value: "Fine" },
    { label: "Zester", value: "Zester" }
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
          <Label>Length (inches)</Label>
          <Input
            type="number"
            placeholder="Enter length..."
            value={specs.kitchen_length || ''}
            onChange={(e) => onChange('kitchen_length', e.target.value)}
          />
        </div>
      </div>

      {/* Type and Features */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Utensil Type</Label>
          <Autocomplete
            options={utensilTypeOptions}
            getOptionLabel={(option) => option.label}
            value={utensilTypeOptions.find(opt => opt.value === specs.kitchen_shapetype) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_shapetype', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select type..."
                sx={inputStyles}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Blade Type</Label>
          <Autocomplete
            options={bladeTypeOptions}
            getOptionLabel={(option) => option.label}
            value={bladeTypeOptions.find(opt => opt.value === specs.kitchen_bladetype) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_bladetype', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select blade type..."
                sx={inputStyles}
              />
            )}
          />
        </div>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heat Resistance</Label>
          <Input
            placeholder="E.g., 200°C/392°F"
            value={specs.kitchen_heatresistance || ''}
            onChange={(e) => onChange('kitchen_heatresistance', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Blade Material</Label>
          <Autocomplete
            freeSolo
            options={materialOptions}
            getOptionLabel={(option) => option.label || option}
            value={specs.kitchen_bladematerial || ''}
            onChange={(_, newValue) => 
              onChange('kitchen_bladematerial', typeof newValue === 'string' ? newValue : newValue?.value)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select blade material..."
                sx={inputStyles}
              />
            )}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.kitchen_dishwashersafe || false}
            onCheckedChange={(checked) => 
              onChange('kitchen_dishwashersafe', checked)
            }
          />
          <Label>Dishwasher Safe</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={specs.kitchen_lockingmechanism || false}
            onCheckedChange={(checked) => 
              onChange('kitchen_lockingmechanism', checked)
            }
          />
          <Label>Locking Mechanism</Label>
        </div>
      </div>
    </div>
  );
};

KitchenUtensilsSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default KitchenUtensilsSpecs; 