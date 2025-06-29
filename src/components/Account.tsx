import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  ThemeProvider,
  createTheme,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ThemeToggle from "./ThemeToggle";

import config from "../../config.json";


const buttonTheme = createTheme({
  typography: {
    fontFamily: "Fort",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: "Fort",
          fontSize: "24px",
          color: "rgb(100, 108, 255)",
          textTransform: "none",
        }
      }
    }
  }
});

interface AccountProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const Account: React.FC<AccountProps> = ({ theme, toggleTheme }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchAccountInfo = useCallback(async () => {
    try {
      const response = await fetch(`https://${config.subdomain}.${config.domain_name}/auth/users/info`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          mode: "cors",
        }
      );
      const data = await response.json();

      if (response.ok && data) {
        setAccount(data);
        console.log(data);
        localStorage.setItem("user_data", JSON.stringify(data));
      } else {
        handleLogout();
      }
    } catch (error) {
      setErrorMessage("Failed to get account data. Servers may not be responding.");
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchAccountInfo();
  }, [token, fetchAccountInfo]);

  const getSHA256Hash = async (input: string) => {
    const textAsBuffer = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
      .map((item) => item.toString(16).padStart(2, "0"))
      .join("");
    return hash;
  };

  const handleLoginSubmit = async () => {
    const userID = (document.getElementById("userID") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;
    const hashed_password = await getSHA256Hash(password);

    try {
      const response = await fetch(`https://${config.subdomain}.${config.domain_name}/auth/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userID, hashed_password }),
          mode: "cors",
        }
      );

      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setShowDialog(false);
      } else {
        setErrorMessage("Failed to login: Check credentials");
      }
    } catch (error: any) {
      setErrorMessage("Failed to login: " + error.message);
    }
  };
  const handleLogin = () => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleLoginSubmit();
      }
    });

    setShowDialog(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("apple-playlists");
    localStorage.removeItem("spotify-playlists");
    setToken(null);
    setAccount(null);
    setTimeout(() => window.location.reload(), 200);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Login</DialogTitle>

        <DialogContent>
          <DialogContentText>Please login to your account.</DialogContentText>
          {errorMessage && (
            <DialogContentText style={{ color: "red" }}>
              {errorMessage}
            </DialogContentText>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="userID"
            label="Username"
            type="text"
            fullWidth
          />
          <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLoginSubmit} color="primary">
            Login
          </Button>
        </DialogActions>
      </Dialog>

      {account ? (
        <ThemeProvider theme={buttonTheme}>
          <IconButton onClick={handleMenuOpen} color="inherit">
            <AccountCircleIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem>
              <ThemeToggle theme={theme} toggle={toggleTheme} />
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }}>Logout</MenuItem>
          </Menu>
        </ThemeProvider>
      ) : (
        <IconButton onClick={handleLogin} color="inherit">
          <AccountCircleIcon />
        </IconButton>
      )}
    </div>
  );
};

export default Account;
