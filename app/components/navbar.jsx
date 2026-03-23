import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export function Navbar() {
  return (
    <Box>
      <AppBar>
        <Toolbar>
          <IconButton>
            <MenuIcon />
          </IconButton>
          <Typography>My application</Typography>
          <Button>Login</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
