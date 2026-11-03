import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const KidsWearSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    'Cotton', 'Polyester', 'Satin', 'Synthetic', 'Canvas'
  ];

  const sizeOptions = ['2T', '4T', '6T', 'Kid Sizes'];
  const patternOptions = ['Solid', 'Cartoon Print'];
  const styleOptions = ['Dresses', 'Skirts', 'Pajamas'];
  const shoeTypeOptions = ['Sneakers', 'Sandals'];
  const accessoryOptions = ['Hats', 'Sunglasses', 'Belts'];

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
      {/* Material and Sizes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Material</Label>
          <Autocomplete
            freeSolo
            options={materialOptions}
            value={specs.fashion_material || ''}
            onChange={(_, newValue) => onChange('fashion_material', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select material" sx={inputStyles} />
            )}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Available Sizes</Label>
          <Autocomplete
            multiple
            options={sizeOptions}
            value={specs.fashion_sizes || []}
            onChange={(_, newValues) => onChange('fashion_sizes', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select sizes" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Patterns and Styles */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Patterns</Label>
          <Autocomplete
            options={patternOptions}
            value={specs.fashion_pattern || ''}
            onChange={(_, newValue) => onChange('fashion_pattern', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select pattern" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Clothing Style</Label>
          <Autocomplete
            options={styleOptions}
            value={specs.fashion_style || ''}
            onChange={(_, newValue) => onChange('fashion_style', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select style" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Footwear and Accessories */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Shoe Type</Label>
          <Autocomplete
            options={shoeTypeOptions}
            value={specs.fashion_shoeType || ''}
            onChange={(_, newValue) => onChange('fashion_shoeType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select shoe type" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Accessory Type</Label>
          <Autocomplete
            options={accessoryOptions}
            value={specs.fashion_accessoryType || ''}
            onChange={(_, newValue) => onChange('fashion_accessoryType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select accessory" sx={inputStyles} />
            )}
          />
        </div>
      </div>
    </div>
  );
};

KidsWearSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default KidsWearSpecs; 