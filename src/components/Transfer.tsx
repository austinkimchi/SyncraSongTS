import React from 'react';
import arrow from '../assets/images/arrow1.svg';
import PlaylistCollection from './PlaylistCollection';


const Transfer: React.FC = () => {
    return (
        <>
            {/* Notch absolute container for the components of transfer */}
            <div className="bg-bg1 px-6 py-4 drop-shadow rounded-[50px] gap-3 justify-center mx-auto text-center w-[30%] absolute left-[50%] top-3 justify-items-center -translate-x-[50%] hidden md:flex">
                <p className="w-30 bg-bg5/30 rounded-lg py-2 text-secondary md:w-40 md:px-3">Apple Music</p>
                <img onClick={() => { }}
                    src={arrow}
                    alt="arrow"
                    className="cursor-pointer"
                    width={25} />
                <p className="w-30 bg-bg5/30 rounded-lg py-2 text-secondary md:w-40 md:px-3">Spotify</p>
            </div>
            
            <div className={`flex flex-col mb-8 mx-2 md:mx-16`}>
                <section className={`flex flex-col md:flex-row gap-5 bg-bg1 rounded-md justify-between py-5 drop-shadow justify-between px-[3%] md:py-10`}>

                    <p className="text-secondary text-lg text-pretty  font-extrabold px-4 md:px-0 md:text-2xl md:text-nowrap">
                        Select or Drag playlists up here to transfer...
                    </p>
                    <div className='flex gap-2 font-bold'>
                        <button
                            className={`max-w-[200px] min-w-[170px] h-[40px] text-nowrap bg-bg3 text-secondary justify-center md:justify-self-end scale-95 justify-self-center md:scale-none`}
                            onClick={() => {
                                // transfer action here
                            }}
                            disabled={false}
                        >
                            Commit Transfer
                        </button>
                        <button
                            className={`max-w-[200px] min-w-[170px] h-[40px] text-nowrap bg-bg5 text-bg1 justify-center md:justify-self-end scale-95 justify-self-center md:scale-none`}
                            onClick={() => {
                                // cancel action here
                            }}
                            disabled={false}
                        >
                            Cancel All
                        </button>
                    </div>
                </section >
            </div>
        </>
    );
};

export default Transfer;