import { Autocomplete, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const GameSpecs = ({ specs, onChange }) => {
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

  const genres = [
    'Action',
    'Adventure',
    'Sports',
    'RPG'
  ];

  const ratings = [
    'E',
    'T',
    'M'
  ];

  const regions = [
    'PAL',
    'NTSC'
  ];

  const platforms = [
    'Nintendo Switch',
    'DS',
    'PS5',
    'PS4',
    'Xbox Series X|S',
    'Xbox One',
    'PC'
  ];

  const gameTitles = [
    'FIFA',
    'Call of Duty',
    'Grand Theft Auto'
  ];

  const features = [
    'Multiplayer',
    'Online Modes',
    'Cross-Platform',
    'Single Player',
    'Co-op'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Game Title</label>
        <Autocomplete
          options={gameTitles}
          value={specs.gaming_title || ''}
          onChange={(_, newValue) => onChange('gaming_title', newValue)}
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Enter or select game title"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Genre</label>
        <Autocomplete
          multiple
          options={genres}
          value={specs.gaming_genre || []}
          onChange={(_, newValue) => onChange('gaming_genre', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select genres"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Age Rating</label>
        <Autocomplete
          options={ratings}
          value={specs.gaming_rating || ''}
          onChange={(_, newValue) => onChange('gaming_rating', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select age rating"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Region</label>
        <Autocomplete
          options={regions}
          value={specs.gaming_region || ''}
          onChange={(_, newValue) => onChange('gaming_region', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select region"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Platform Compatibility</label>
        <Autocomplete
          multiple
          options={platforms}
          value={specs.gaming_compatibility || []}
          onChange={(_, newValue) => onChange('gaming_compatibility', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select compatible platforms"
              sx={inputStyles}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Features</label>
        <Autocomplete
          multiple
          options={features}
          value={specs.gaming_features || []}
          onChange={(_, newValue) => onChange('gaming_features', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select features"
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

GameSpecs.propTypes = {
  specs: PropTypes.shape({
    gaming_title: PropTypes.string,
    gaming_genre: PropTypes.arrayOf(PropTypes.string),
    gaming_rating: PropTypes.string,
    gaming_region: PropTypes.string,
    gaming_compatibility: PropTypes.arrayOf(PropTypes.string),
    gaming_features: PropTypes.arrayOf(PropTypes.string)
  }),
  onChange: PropTypes.func.isRequired
};

export default GameSpecs; 