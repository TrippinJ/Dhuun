// /* eslint-disable jsx-a11y/anchor-is-valid */
// import React, { useState } from "react";
// import Logo from "../Assets/DHUUN.png";
// import { BsCart2 } from "react-icons/bs";
// import { HiOutlineBars3 } from "react-icons/hi2";
// import Box from "@mui/material/Box";
// import Drawer from "@mui/material/Drawer";
// import List from "@mui/material/List";
// import Divider from "@mui/material/Divider";
// import ListItem from "@mui/material/ListItem";
// import ListItemButton from "@mui/material/ListItemButton";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import ListItemText from "@mui/material/ListItemText";
// import HomeIcon from "@mui/icons-material/Home";
// import InfoIcon from "@mui/icons-material/Info";
// import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
// import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
// import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
// import Login from "./Login";


// const Navbar = () => {
//   const [openMenu, setOpenMenu] = useState(false);
//   const menuOptions = [
//     {
//       text: "Home",
//       icon: <HomeIcon />,
//     },
//     {
//       text: "About",
//       icon: <InfoIcon />,
//     },
//     {
//       text: "Testimonials",
//       icon: <CommentRoundedIcon />,
//     },
//     {
//       text: "Contact",
//       icon: <PhoneRoundedIcon />,
//     },
//     {
//       text: "Cart",
//       icon: <ShoppingCartRoundedIcon />,
//     },
//   ];
//   return (
//     <nav>
//       <div className="nav-logo-container">
//         <img src={Logo} alt="" width={100} style={{height: "auto"}}/>
//       </div>
//       <div className="navbar-links-container">
//         <a href="">Buy Beats</a>
//         <a href="">Sell Beats</a>
//         <a href="">Creator Community</a>
//         <a href="">Sign Up</a>
//         <a href="">
//           <BsCart2 className="navbar-cart-icon" />
//         </a>
//         <button className="primary-button">Start Your Journey</button>
//       </div>
//       <div className="navbar-menu-container">
//         <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
//       </div>
//       <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
//         <Box
//           sx={{ width: 250 }}
//           role="presentation"
//           onClick={() => setOpenMenu(false)}
//           onKeyDown={() => setOpenMenu(false)}
//         >
//           <List>
//             {menuOptions.map((item) => (
//               <ListItem key={item.text} disablePadding>
//                 <ListItemButton>
//                   <ListItemIcon>{item.icon}</ListItemIcon>
//                   <ListItemText primary={item.text} />
//                 </ListItemButton>
//               </ListItem>
//             ))}
//           </List>
//           <Divider />
//         </Box>
//       </Drawer>
//     </nav>
//   );
// };

// export default Navbar;


// /* eslint-disable jsx-a11y/anchor-is-valid */
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
// import Logo from "../Assets/DHUUN.png";
// import { BsCart2 } from "react-icons/bs";
// import { HiOutlineBars3 } from "react-icons/hi2";
// import Box from "@mui/material/Box";
// import Drawer from "@mui/material/Drawer";
// import List from "@mui/material/List";
// import Divider from "@mui/material/Divider";
// import ListItem from "@mui/material/ListItem";
// import ListItemButton from "@mui/material/ListItemButton";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import ListItemText from "@mui/material/ListItemText";
// import HomeIcon from "@mui/icons-material/Home";
// import InfoIcon from "@mui/icons-material/Info";
// import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
// import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
// import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
// import { Link } from "react-router-dom";

// const Navbar = () => {
//   const [openMenu, setOpenMenu] = useState(false);
//   const navigate = useNavigate(); // Initialize useNavigate for programmatic navigation

//   const menuOptions = [
//     {
//       text: "Home",
//       icon: <HomeIcon />,
//       route: "/", // Add routes for navigation
//     },
//     {
//       text: "About",
//       icon: <InfoIcon />,
//       route: "/about",
//     },
//     {
//       text: "Testimonials",
//       icon: <CommentRoundedIcon />,
//       route: "/testimonials",
//     },
//     {
//       text: "Contact",
//       icon: <PhoneRoundedIcon />,
//       route: "/contact",
//     },
//     {
//       text: "Cart",
//       icon: <ShoppingCartRoundedIcon />,
//       route: "/cart",
//     },
//   ];

//   return (
//     <nav>
//       <div className="nav-logo-container">
//         <img src={Logo} alt="" width={100} style={{ height: "auto" }} />
//       </div>
//       <div className="navbar-links-container">
//         <a href="/buy-beats">Buy Beats</a>
//         <a href="/sell-beats">Sell Beats</a>
//         <a href="/creator-community">Creator Community</a>
//         <a href="/signup"onClick={() => navigate("/Register")}>Sign Up</a>
//         <a href="/cart">
//           <BsCart2 className="navbar-cart-icon" />
//         </a>
//         {/* Update button to navigate to the Login page */}
//         <button
//           className="primary-button"
//           onClick={() => navigate("/login")} // Navigate to /login on click
//         >
//           Start Your Journey
//         </button>

//       </div>

//       <div className="navbar-menu-container">
//         <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
//       </div>
//       <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
//         <Box
//           sx={{ width: 250 }}
//           role="presentation"
//           onClick={() => setOpenMenu(false)}
//           onKeyDown={() => setOpenMenu(false)}
//         >
//           <List>
//             {menuOptions.map((item) => (
//               <ListItem key={item.text} disablePadding>
//                 <ListItemButton onClick={() => navigate(item.route)}> {/* Navigate to menu route */}
//                   <ListItemIcon>{item.icon}</ListItemIcon>
//                   <ListItemText primary={item.text} />
//                 </ListItemButton>
//               </ListItem>
//             ))}
//           </List>
//           <Divider />
//         </Box>
//       </Drawer>
//     </nav>
//   );
// };

// export default Navbar;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
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
import InfoIcon from "@mui/icons-material/Info";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate for programmatic navigation

  const menuOptions = [
    {
      text: "Home",
      icon: <HomeIcon />,
      route: "/", // Add routes for navigation
    },
    {
      text: "About",
      icon: <InfoIcon />,
      route: "/about",
    },
    {
      text: "Testimonials",
      icon: <CommentRoundedIcon />,
      route: "/testimonials",
    },
    {
      text: "Contact",
      icon: <PhoneRoundedIcon />,
      route: "/contact",
    },
    {
      text: "Cart",
      icon: <ShoppingCartRoundedIcon />,
      route: "/cart",
    },
  ];

  return (
    <nav>
      <div className="nav-logo-container">
        <img src={Logo} alt="Dhuun Logo" width={100} style={{ height: "auto" }} />
      </div>
      <div className="navbar-links-container">
        <a href="/buy-beats">Buy Beats</a>
        <a href="/sell-beats">Sell Beats</a>
        <a href="/creator-community">Creator Community</a>
        <a
          href="#"
          className="primary-link"
          onClick={() => navigate("/Login")} // Navigate to Register page
        >
          Log In
        </a>
        <a href="/cart">
          <BsCart2 className="navbar-cart-icon" />
        </a>
        {/* Update button to navigate to the Login page */}
        <button
          className="primary-button"
          onClick={() => navigate("/chooserole")} 
        >
          Start Your Journey
        </button>
      </div>

      <div className="navbar-menu-container">
        <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
      </div>
      <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setOpenMenu(false)}
          onKeyDown={() => setOpenMenu(false)}
        >
          <List>
            {menuOptions.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.route)}>
                  {/* Navigate to menu route */}
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
    </nav>
  );
};

export default Navbar;
