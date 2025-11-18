import React, { useEffect, useState } from "react";

// Components
import Connect from "./components/Connect";
import About from "./components/About";
import Link from "./components/Link";
import Nav from "./components/Nav";
import CreateAccountModal from "./components/CreateAccountModal";

import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import "./handler/callback";

import { setNavigator } from "./handler/createNavigate";
import Transfer from "./components/Transfer";
import { getPendingAccount, subscribeToPendingAccount } from "./handler/pendingAccount";

const App: React.FC = () => {
  const [pendingAccount, setPendingAccount] = useState(getPendingAccount());

  useEffect(() => {
    const updatePendingAccount = () => setPendingAccount(getPendingAccount());

    const unsubscribe = subscribeToPendingAccount(updatePendingAccount);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Nav />
      <AnimatedRoutes />
      {pendingAccount && <CreateAccountModal pendingAccount={pendingAccount} />}
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
