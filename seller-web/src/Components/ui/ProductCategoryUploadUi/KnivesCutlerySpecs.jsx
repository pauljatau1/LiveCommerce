import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const KnivesCutlerySpecs = ({ specs, onChange }) => {
  const bladeMaterialOptions = [
    { label: "Stainless Steel", value: "Stainless Steel" },
    { label: "Carbon Steel", value: "Carbon Steel" }
  ];

  const handleMaterialOptions = [
    { label: "Wood", value: "Wood" },
    { label: "Plastic", value: "Plastic" },
    { label: "Steel", value: "Steel" }
  ];

  const knifeTypeOptions = [
    { label: "Chef's Knife", value: "Chef's Knife" },
    { label: "Paring Knife", value: "Paring Knife" },
    { label: "Boning Knife", value: "Boning Knife" }
  ];

  const finishOptions = [
    { label: "Polished", value: "Polished" },
    { label: "Matte", value: "Matte" }
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
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Blade Material</Label>
          <Autocomplete
            options={bladeMaterialOptions}
            getOptionLabel={(option) => option.label}
            value={bladeMaterialOptions.find(opt => opt.value === specs.kitchen_bladematerial) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_bladematerial', newValue?.value || '')
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

        <div className="space-y-2">
          <Label>Handle Material</Label>
          <Autocomplete
            options={handleMaterialOptions}
            getOptionLabel={(option) => option.label}
            value={handleMaterialOptions.find(opt => opt.value === specs.kitchen_handletype) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_handletype', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select handle material..."
                sx={inputStyles}
              />
            )}
          />
        </div>
      </div>

      {/* Type and Features */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Knife Type</Label>
          <Autocomplete
            options={knifeTypeOptions}
            getOptionLabel={(option) => option.label}
            value={knifeTypeOptions.find(opt => opt.value === specs.kitchen_bladetype) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_bladetype', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select knife type..."
                sx={inputStyles}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Blade Length (inches)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter length..."
            value={specs.kitchen_bladelength || ''}
            onChange={(e) => onChange('kitchen_bladelength', e.target.value)}
          />
        </div>
      </div>

      {/* Quantity and Finish */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Number of Pieces</Label>
          <Input
            type="number"
            placeholder="Enter number..."
            value={specs.kitchen_numberofcups || ''}
            onChange={(e) => onChange('kitchen_numberofcups', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Finish</Label>
          <Autocomplete
            options={finishOptions}
            getOptionLabel={(option) => option.label}
            value={finishOptions.find(opt => opt.value === specs.kitchen_finish) || null}
            onChange={(_, newValue) => 
              onChange('kitchen_finish', newValue?.value || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select finish..."
                sx={inputStyles}
              />
            )}
          />
        </div>
      </div>

      {/* Checkboxes */}
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

KnivesCutlerySpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default KnivesCutlerySpecs; 