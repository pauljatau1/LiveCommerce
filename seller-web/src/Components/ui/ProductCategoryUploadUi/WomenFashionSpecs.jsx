import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const WomenFashionSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    'Cotton', 'Polyester', 'Silk', 'Denim', 'Lace',
    'Leather', 'Synthetic', 'Canvas', 'Suede',
    'Wool', 'Satin', 'Faux Leather'
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'Plus Sizes'];
  const styleOptions = ['Casual', 'Formal', 'Party', 'Workwear'];
  const sleeveOptions = ['Short Sleeve', 'Long Sleeve', 'Sleeveless'];
  const lengthOptions = ['Full-Length', 'Knee-Length', 'Cropped'];
  const heelOptions = ['Flat', 'Stiletto', 'Wedge'];
  const closureOptions = ['Lace-Up', 'Slip-On', 'Buckle', 'Zipper', 'Button', 'Magnetic'];
  const accessoryOptions = ['Scarves', 'Hats', 'Belts', 'Sunglasses', 'Gloves', 'Necklaces', 'Bracelets', 'Rings', 'Earrings'];
  const bagTypeOptions = ['Tote Bags', 'Clutches', 'Crossbody Bags'];
  const stoneOptions = ['Diamonds', 'Gemstones', 'Crystals'];
  const colorOptions = ['Black', 'Beige', 'Multicolor'];

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
      {/* Material and Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
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

      {/* Style and Occasion */}
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Style</Label>
          <Autocomplete
            options={styleOptions}
            value={specs.fashion_style || ''}
            onChange={(_, newValue) => onChange('fashion_style', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select style" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Occasion</Label>
          <Autocomplete
            options={styleOptions}
            value={specs.fashion_occasion || ''}
            onChange={(_, newValue) => onChange('fashion_occasion', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select occasion" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Sleeve and Length */}
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sleeve Type</Label>
          <Autocomplete
            options={sleeveOptions}
            value={specs.fashion_sleeveType || ''}
            onChange={(_, newValue) => onChange('fashion_sleeveType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select sleeve type" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Length</Label>
          <Autocomplete
            options={lengthOptions}
            value={specs.fashion_length || ''}
            onChange={(_, newValue) => onChange('fashion_length', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select length" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Footwear Specific */}
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heel Type (if footwear)</Label>
          <Autocomplete
            options={heelOptions}
            value={specs.fashion_heelType || ''}
            onChange={(_, newValue) => onChange('fashion_heelType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select heel type" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Closure Type</Label>
          <Autocomplete
            options={closureOptions}
            value={specs.fashion_closure || ''}
            onChange={(_, newValue) => onChange('fashion_closure', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select closure" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Accessories */}
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Accessory Type</Label>
          <Autocomplete
            options={accessoryOptions}
            value={specs.fashion_accessoryType || ''}
            onChange={(_, newValue) => onChange('fashion_accessoryType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select accessory type" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Stone Type (if jewelry)</Label>
          <Autocomplete
            options={stoneOptions}
            value={specs.fashion_stoneType || ''}
            onChange={(_, newValue) => onChange('fashion_stoneType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select stone type" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Colors and Bag Type */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Available Colors</Label>
          <Autocomplete
            multiple
            options={colorOptions}
            value={specs.fashion_colors || []}
            onChange={(_, newValues) => onChange('fashion_colors', newValues)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select colors" sx={inputStyles} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Bag Type (if applicable)</Label>
          <Autocomplete
            options={bagTypeOptions}
            value={specs.fashion_bagType || ''}
            onChange={(_, newValue) => onChange('fashion_bagType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select bag type" sx={inputStyles} />
            )}
          />
        </div>
      </div>
    </div>
  );
};

WomenFashionSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default WomenFashionSpecs; 