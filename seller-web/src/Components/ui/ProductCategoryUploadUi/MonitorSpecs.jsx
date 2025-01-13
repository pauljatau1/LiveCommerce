import { Autocomplete, TextField } from '@mui/material';
import { Label } from "../label";
import { Input } from "../input2";
import PropTypes from 'prop-types';

const MonitorSpecs = ({ specs, onChange }) => {
  const resolutionOptions = [
    { label: "1080p", value: "1080p" },
    { label: "1440p", value: "1440p" },
    { label: "4K", value: "4K" }
  ];

  const panelTypeOptions = [
    { label: "IPS", value: "IPS" },
    { label: "TN", value: "TN" },
    { label: "VA", value: "VA" }
  ];

  const refreshRateOptions = [
    { label: "60Hz", value: "60Hz" },
    { label: "120Hz", value: "120Hz" },
    { label: "144Hz", value: "144Hz" }
  ];

  const connectivityOptions = [
    { label: "HDMI", value: "HDMI" },
    { label: "DisplayPort", value: "DisplayPort" },
    { label: "USB-C", value: "USB-C" }
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
      {/* Screen Size */}
      <div className="space-y-2">
        <Label>Screen Size (inches)</Label>
        <Input
          type="number"
          placeholder="Enter screen size..."
          value={specs.computing_screensize || ''}
          onChange={(e) => onChange('computing_screensize', e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <Label>Resolution</Label>
        <Autocomplete
          freeSolo
          options={resolutionOptions.map((option) => option.label)}
          value={specs.computing_resolution || ''}
          onChange={(_, newValue) => {
            onChange('computing_resolution', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select resolution..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Panel Type */}
      <div className="space-y-2">
        <Label>Panel Type</Label>
        <Autocomplete
          freeSolo
          options={panelTypeOptions.map((option) => option.label)}
          value={specs.computing_panelType || ''}
          onChange={(_, newValue) => {
            onChange('computing_panelType', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select panel type..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Refresh Rate */}
      <div className="space-y-2">
        <Label>Refresh Rate</Label>
        <Autocomplete
          freeSolo
          options={refreshRateOptions.map((option) => option.label)}
          value={specs.computing_refreshRate || ''}
          onChange={(_, newValue) => {
            onChange('computing_refreshRate', newValue || '');
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select refresh rate..."
              sx={inputStyles}
            />
          )}
        />
      </div>

      {/* Connectivity */}
      <div className="space-y-2">
        <Label>Connectivity</Label>
        <Autocomplete
          freeSolo
          multiple
          options={connectivityOptions.map((option) => option.label)}
          value={specs.computing_connectivity || []}
          onChange={(_, newValue) => {
            onChange('computing_connectivity', newValue);
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Enter or select connectivity options..."
              sx={inputStyles}
            />
          )}
        />
      </div>
    </div>
  );
};

MonitorSpecs.propTypes = {
  specs: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default MonitorSpecs;
