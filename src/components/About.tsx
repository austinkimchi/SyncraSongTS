import React from "react";

const About: React.FC = () => {
    return (
        <>
            {/* Second section; Description */}
            < section className={`mb-16 bg-bg2 rounded-md mx-2 md:mx-16 2xl:mx-32`}>
                <h2 className="text-bg3 font-extrabold px-8 text-left text-lg/[30px] text-pretty tracking-wide py-10 md:py-20 text-pretty md:text-3xl/[50px] md:text-center">SyncraSong is the ultimate tool to transfer music playlists <br className="hidden md:inline" />across multiple top music platforms, providing seamless <br className="hidden md:inline" />synchronization up-to-date with your latest song additions.</h2>
            </section >

            {/* Third section; Highlights the features */}
            <section className="flex justify-evenly bg-gradient-to-r from-bg3 to-bg4 px-4 md:px-24 text-lg/[20px] py-18 md:text-center text-secondary font-extrabold flex-col gap-10 md:gap-6 md:flex-row md:text-lg/[28px] md:items-center leading-none text-balance" >
                <p className="w-200 max-w-[260px]">Transfer playlists between platforms, even the whole batch in on go!</p>

                <p className="w-300 max-w-[300px]">Sync Playlists up-to-date with <br className="hidden lg:inline" />your latest songs additions, even <br className="hidden md:inline" />after transferring cross-platforms.</p>

                <p className="w-200 max-w-[260px]">Share playlists with friends across platforms with personalized links.</p>
            </section >
            {/* Fourth section; Footer */}
            < section className="flex flex-col bg-bg1" >
                <div className={`flex flex-col text-secondary font-extrabold text-lg/[28px] py-[90px] mx-4 md:mx-16 2xl:mx-32 w-fit md:max-w-[20%]`}>
                    <div>
                        <a className="cursor-pointer">About</a>
                    </div>
                    <div>
                        <a className="cursor-pointer">Contact</a>
                    </div>
                    <div>
                        <a className="cursor-pointer">My Account</a>
                    </div>
                </div>


                <footer className="text-center text-secondary py-6">
                    &copy; 2026 austin.kim All rights reserved.
                </footer>
            </section >
        </>
    );
};

export default About;