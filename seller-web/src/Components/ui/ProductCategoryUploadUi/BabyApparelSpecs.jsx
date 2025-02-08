import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import PropTypes from 'prop-types';

const BabyApparelSpecs = ({ specs, onChange }) => {
  const productTypeOptions = [
    'Onesies', 'Rompers', 'Sets', 'Outerwear', 'Dresses',
    'Bodysuits', 'Tops', 'Bottoms', 'Pajamas', 'T-Shirts',
    'Shorts', 'Jackets', 'Skirts', 'Hats', 'Mittens', 'Gloves', 'Socks'
  ];

  const materialOptions = ['Cotton', 'Organic', 'Blended', 'Wool'];
  const patternOptions = ['Floral', 'Striped', 'Plain'];
  const fitOptions = ['Slim', 'Regular', 'Loose'];
  const featureOptions = ['Ruffled', 'Embroidered'];
  const closureOptions = ['Zipper', 'Buttons'];

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
        {/* Product Type */}
        <div className="space-y-2">
          <Label>Product Type</Label>
          <Autocomplete
            multiple
            options={productTypeOptions}
            value={specs.baby_productType || []}
            onChange={(_, newValues) => onChange('baby_productType', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select product types" sx={inputStyles} />
            )}
          />
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label>Size</Label>
          <TextField
            fullWidth
            value={specs.baby_size || ''}
            onChange={(e) => onChange('baby_size', e.target.value)}
            placeholder="Enter size (e.g., 2T, 3-6M)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Material */}
        <div className="space-y-2">
          <Label>Material</Label>
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

        {/* Pattern */}
        <div className="space-y-2">
          <Label>Pattern</Label>
          <Autocomplete
            multiple
            options={patternOptions}
            value={specs.baby_pattern || []}
            onChange={(_, newValues) => onChange('baby_pattern', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select patterns" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fit</Label>
          <Autocomplete
            options={fitOptions}
            value={specs.baby_fit || ''}
            onChange={(_, newValue) => onChange('baby_fit', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select fit" sx={inputStyles} />
            )}
          />
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

      {/* Color and Closure */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Color</Label>
          <TextField
            fullWidth
            value={specs.baby_color || ''}
            onChange={(e) => onChange('baby_color', e.target.value)}
            placeholder="Enter color name/code"
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
              <TextField {...params} placeholder="Select closure types" sx={inputStyles} />
            )}
          />
        </div>
      </div>
    </div>
  );
};

BabyApparelSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BabyApparelSpecs; 