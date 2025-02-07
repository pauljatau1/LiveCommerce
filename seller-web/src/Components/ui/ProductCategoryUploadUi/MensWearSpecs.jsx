import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import { Checkbox } from "../checkbox";
import PropTypes from 'prop-types';

const MensWearSpecs = ({ specs, onChange }) => {
  const materialOptions = [
    'Cotton', 'Wool', 'Linen', 'Leather', 'Synthetic', 'Silk', 'Plastic'
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const styleOptions = ['Casual', 'Formal', 'Sportswear'];
  const fitOptions = ['Slim Fit', 'Regular Fit'];
  const closureOptions = ['Lace-Up', 'Slip-On'];
  const shoeTypeOptions = ['Sneakers', 'Dress Shoes', 'Sandals'];
  const accessoryOptions = ['Ties', 'Wallets', 'Hats', 'Sunglasses'];
  const traditionalOptions = ['Agbada', 'Kaftan', 'Dashiki', 'Senator'];

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

      {/* Style and Fit */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
          <Label>Fit Type</Label>
          <Autocomplete
            options={fitOptions}
            value={specs.fashion_fit || ''}
            onChange={(_, newValue) => onChange('fashion_fit', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select fit" sx={inputStyles} />
            )}
          />
        </div>
      </div>

      {/* Footwear Section */}
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label>Traditional Wear Type</Label>
          <Autocomplete
            options={traditionalOptions}
            value={specs.fashion_traditionalType || ''}
            onChange={(_, newValue) => onChange('fashion_traditionalType', newValue || '')}
            renderInput={(params) => (
              <TextField {...params} placeholder="Select type" sx={inputStyles} />
            )}
          />
        </div>
      </div>
    </div>
  );
};

MensWearSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default MensWearSpecs; 