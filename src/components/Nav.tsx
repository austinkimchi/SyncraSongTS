import React from "react";
import Account from "./Account";
import { useNavigate } from "react-router-dom";

const Nav: React.FC = () => {
    const navigate = useNavigate();

    return (
        <nav className={`navbar flex justify-between py-4 mx-2 md:mx-16`}>
            <h1
                className="m-0! text-primary font-extrabold text-3xl! self-center cursor-pointer select-none"
                onClick={() => navigate('/')}
            >SyncraSong</h1>
            <Account />
        </nav>
    )
};

export default Nav;