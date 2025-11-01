import React from 'react';
import { render } from 'vitest-browser-react';
import { DndProvider } from "react-dnd";
import { TestBackend } from "react-dnd-test-backend";
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import App from '../App';

import Platform from '../types/platform';
import { DEMO_PLAYLISTS_APPLE, DEMO_PLAYLISTS_SPOTIFY } from '../data/demoPlaylists';
import { Playlist } from '../types/playlist';
import { state } from '../types/status';

import '../css/App.css';
import '../css/PlaylistCard.css';
import '../css/PlaylistSection.css';


const sampleList: Playlist[] = [
    {
        id: '1',
        name: 'Chill Vibes',
        trackCount: 21,
        platform: Platform.SPOTIFY,
        href: '',
        image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200005caf330ca3a3bfaf8b18407fb33e',
        isPublic: false,
        status: state.PENDING
    },
    {
        id: '2',
        name: 'Sleep',
        trackCount: 22,
        platform: Platform.APPLE_MUSIC,
        href: '',
        image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200005caf1cef0cee1e498abb8e74955f',
        isPublic: true,
        status: state.SUCCESS
    },
    {
        id: '3',
        name: 'Today\'s Top Hits',
        trackCount: 23,
        platform: Platform.SOUNDCLOUD,
        href: '',
        image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200008e2c21cf047fac53f26680dcad78',
        isPublic: true,
        status: state.SUCCESS
    },
];

function renderDnd(ui: React.ReactElement) {
    return render(<DndProvider backend={TestBackend}>{ui}</DndProvider>);
}

describe('App', () => {
    // act logged in
    beforeEach(() => {
        localStorage.setItem('token', 'fake-token');
    });

    it('renders without crashing', () => {
        renderDnd(<App />);
        expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });

    it('shows demo playlists when in demo mode', async () => {
        localStorage.removeItem('token');
        localStorage.clear();
        renderDnd(<App />);
        expect(await screen.findByText(DEMO_PLAYLISTS_SPOTIFY[0].name)).toBeInTheDocument();
        expect(await screen.findByText(DEMO_PLAYLISTS_APPLE[0].name)).toBeInTheDocument();
    });


    it('make sure two providers are loaded', async () => {
        renderDnd(<App />);
        expect(await screen.findByText('Spotify')).toBeInTheDocument();
        expect(await screen.findByText('Apple Music')).toBeInTheDocument();
    });

    it('check clicking theme toggle works', async () => {
        renderDnd(<App />);
        const toggleButton = screen.getByTestId("theme-toggle-button");
        expect(toggleButton).toBeInTheDocument();
        fireEvent.click(toggleButton);
        fireEvent.click(toggleButton);
    });

    it('checks if login works', async () => {
        localStorage.setItem('token', 'abc');
        renderDnd(<App />);
        expect(await screen.findByText('Spotify')).toBeInTheDocument();
        expect(screen.getAllByText('Refresh').length).toBeGreaterThanOrEqual(2);
    }); 

    

});