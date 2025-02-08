import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const TablewareSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    { label: "Ceramic", value: "Ceramic" },
    { label: "Melamine", value: "Melamine" },
    { label: "Glass", value: "Glass" },
    { label: "Bamboo", value: "Bamboo" },
    { label: "Plastic", value: "Plastic" }
  ];

  const shapeOptions = [
    { label: "Round", value: "Round" },
    { label: "Square", value: "Square" }
  ];

  const typeOptions = [
    { label: "Wine Glass", value: "Wine Glass" },
    { label: "Juice Glass", value: "Juice Glass" },
    { label: "Tumblers", value: "Tumblers" }
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
      {/* Material and Shape */}
      <div className="grid grid-cols-1 gap-4">
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
          <Label>Shape</Label>
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

      {/* Capacity and Type */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Capacity (liters)</Label>
          <Input
            type="number"
            placeholder="Enter capacity..."
            value={specs.kitchen_capacity || ''}
            onChange={(e) => onChange('kitchen_capacity', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Autocomplete
            options={typeOptions}
            getOptionLabel={(option) => option.label}
            value={typeOptions.find(opt => opt.value === specs.kitchen_features?.[0]) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_features', newValue?.value ? [newValue.value] : [])
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
      </div>

      {/* Dishwasher Safe */}
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
  );
};

TablewareSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default TablewareSpecs; 