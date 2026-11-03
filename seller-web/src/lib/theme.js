import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#000000',
          '&.Mui-checked': {
            color: '#000000',
          },
        },
      },
    },
  },
});

export default theme;
