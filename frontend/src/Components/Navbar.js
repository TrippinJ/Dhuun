import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Assets/DHUUN.png";
import { BsCart2 } from "react-icons/bs";
import { HiOutlineBars3 } from "react-icons/hi2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import SellIcon from "@mui/icons-material/Sell";
import PeopleIcon from "@mui/icons-material/People";
import LoginIcon from "@mui/icons-material/Login";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { styled } from '@mui/material/styles';

// Custom styled components for the sidebar menu
const StyledListItemButton = styled(ListItemButton)({
  padding: '16px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
});

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: '40px',
  color: '#555',
});

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();

  // Menu items - used for both navbar and sidebar
  const menuItems = [
    { 
      text: "Buy Beats", 
      route: "/buy-beats",
      icon: <StoreIcon />
    },
    { 
      text: "Sell Beats", 
      route: "/sell-beats",
      icon: <SellIcon />
    },
    { 
      text: "Creator Community", 
      route: "/creator-community",
      icon: <PeopleIcon />
    },
    { 
      text: "Log In", 
      route: "/login",
      icon: <LoginIcon />
    },
    {
      text: "Cart",
      route: "/cart",
      icon: <ShoppingCartRoundedIcon />,
      isCart: true
    }
  ];

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo-container">
        <img 
          src={Logo} 
          alt="Dhuun Logo" 
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", width: "100px", height: "auto" }}
        />
      </div>

      {/* Desktop Links */}
      <div className="navbar-links-container">
        {menuItems.map((item, index) => (
          item.isCart ? (
            <a 
              key={index}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.route);
              }}
            >
              <BsCart2 className="navbar-cart-icon" />
            </a>
          ) : (
            <a 
              key={index}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.route);
              }}
            >
              {item.text}
            </a>
          )
        ))}
        <button
          className="primary-button"
          onClick={() => navigate("/chooserole")}
        >
          Start Your Journey
        </button>
      </div>

      {/* Hamburger Menu Icon */}
      <div className="navbar-menu-container">
        <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
      </div>

      {/* Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={openMenu}
        onClose={() => setOpenMenu(false)}
      >
        <Box
          sx={{
            width: 250,
            height: "100%",
            backgroundColor: "#fff",
            paddingTop: "20px"
          }}
          role="presentation"
        >
          <List sx={{ width: '100%' }}>
            {/* Add Home as first item in sidebar */}
            <ListItem disablePadding>
              <StyledListItemButton
                onClick={() => {
                  navigate("/");
                  setOpenMenu(false);
                }}
              >
                <StyledListItemIcon>
                  <HomeIcon />
                </StyledListItemIcon>
                <ListItemText 
                  primary="Home" 
                  primaryTypographyProps={{
                    style: {
                      fontWeight: 500,
                      fontSize: '1rem',
                      color: '#333'
                    }
                  }}
                />
              </StyledListItemButton>
            </ListItem>
            
            {/* All regular menu items */}
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <StyledListItemButton
                  onClick={() => {
                    navigate(item.route);
                    setOpenMenu(false);
                  }}
                >
                  <StyledListItemIcon>
                    {item.icon}
                  </StyledListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      style: {
                        fontWeight: 500,
                        fontSize: '1rem',
                        color: '#333'
                      }
                    }}
                  />
                </StyledListItemButton>
              </ListItem>
            ))}
            
            {/* Add "Start Your Journey" button as a list item */}
            <ListItem disablePadding>
              <StyledListItemButton
                onClick={() => {
                  navigate("/chooserole");
                  setOpenMenu(false);
                }}
                sx={{
                  marginTop: '8px',
                  '&:hover': {
                    backgroundColor: 'rgba(123, 44, 191, 0.1)',
                  }
                }}
              >
                <StyledListItemIcon>
                  <RocketLaunchIcon />
                </StyledListItemIcon>
                <ListItemText 
                  primary="Start Your Journey" 
                  primaryTypographyProps={{
                    style: {
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: '#7B2CBF'
                    }
                  }}
                />
              </StyledListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </nav>
  );
};

export default Navbar;