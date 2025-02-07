import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const FoodStorageSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    { label: "BPA-Free Plastic", value: "BPA-Free Plastic" },
    { label: "Glass", value: "Glass" },
    { label: "Plastic", value: "Plastic" }
  ];

  const typeOptions = [
    { label: "Airtight", value: "Airtight" },
    { label: "Stackable", value: "Stackable" }
  ];

  const lidOptions = [
    { label: "Screw-On", value: "Screw-On" },
    { label: "Airtight", value: "Airtight" }
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
      {/* Material and Type */}
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
          <Label>Storage Type</Label>
          <Autocomplete
            multiple
            options={typeOptions}
            getOptionLabel={(option) => option.label}
            value={typeOptions.filter(opt => specs.kitchen_features?.includes(opt.value))}
            onChange={(_, newValues) => 
              onChange('kitchen_features', newValues.map(v => v.value))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select types..."
                sx={inputStyles}
              />
            )}
          />
        </div>
      </div>

      {/* Lid and Safety Features */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lid Type</Label>
          <Autocomplete
            options={lidOptions}
            getOptionLabel={(option) => option.label}
            value={lidOptions.find(opt => opt.value === specs.kitchen_lockingmechanism) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_lockingmechanism', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select lid type..."
                sx={inputStyles}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={specs.kitchen_features?.includes('Microwave Safe') || false}
              onCheckedChange={(checked) => {
                const newFeatures = checked
                  ? [...(specs.kitchen_features || []), 'Microwave Safe']
                  : (specs.kitchen_features || []).filter(f => f !== 'Microwave Safe');
                onChange('kitchen_features', newFeatures);
              }}
            />
            <Label>Microwave Safe</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={specs.kitchen_dishwashersafe || false}
              onCheckedChange={(checked) => 
                onChange('kitchen_dishwashersafe', checked)
              }
            />
            <Label>Dishwasher Safe</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

FoodStorageSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default FoodStorageSpecs; 