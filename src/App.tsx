import React, { useEffect } from "react";

// Components
import Connect from "./components/Connect";
import About from "./components/About";
import Link from "./components/Link";
import Nav from "./components/Nav";

import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import "./handler/callback";

import { setNavigator } from "./handler/createNavigate";
import Transfer from "./components/Transfer";

const App: React.FC = () => {
  return (
    <Router>
      <Nav />
      <AnimatedRoutes />
    </Router>
  );
};

const AnimatedRoutes: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  const location = useLocation();
  const [isFirstLoad, setIsFirstLoad] = React.useState(true);

  React.useEffect(() => {
    setIsFirstLoad(false);
  }, []);

  const isTransferRoute = location.pathname.startsWith("/transfer");
  return (
    <AnimatePresence mode="popLayout" initial={true}>
      {isTransferRoute ? <></> : <Connect />}
      <motion.div
        key={location.pathname}
        initial={{ x: isFirstLoad ? 0 : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<About />} />
          <Route path="/link" element={<Link />} />
          <Route path="/transfer" element={<Transfer />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export default App;
