import { render } from 'vitest-browser-react'
import { expect, describe, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';
import React from 'react';
import PlaylistCollection from '../components/PlaylistCollection';


import Platform from "../types/platform";
import { Playlist } from "../types/playlist";
import { state } from "../types/status";

import "../css/PlaylistCard.css";
import "../css/PlaylistSection.css";
import "../css/App.css";


function renderDnd(ui: React.ReactElement) {
    return render(<DndProvider backend={TestBackend}>{ui}</DndProvider>);
}

const sampleList: Playlist[] = [
    { id: '1', name: 'Chill Vibes', trackCount: 21, platform: Platform.SPOTIFY, href: '', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200005caf330ca3a3bfaf8b18407fb33e', isPublic: false, status: state.PENDING },
    { id: '2', name: 'Sleep', trackCount: 22, platform: Platform.APPLE_MUSIC, href: '', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200005caf1cef0cee1e498abb8e74955f', isPublic: true, status: state.SUCCESS },
    { id: '3', name: 'Today\'s Top Hits', trackCount: 23, platform: Platform.SOUNDCLOUD, href: '', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200008e2c21cf047fac53f26680dcad78', isPublic: true, status: state.SUCCESS },
];

describe("PlaylistCollection", () => {
    it("renders a grid wrapper", () => {
        renderDnd(<PlaylistCollection playlists={sampleList} />);
        const grid = document.querySelector('.playlist-collection');
        expect(grid).toBeDefined();
        expect(grid?.className).toContain('grid');
    });

    it("renders one PlaylistCard per playlist", () => {
        renderDnd(<PlaylistCollection playlists={sampleList} />);
        expect(screen.getAllByTestId(/playlist-card-/).length).toBe(sampleList.length);
    });

    it("opactity classes set based on drag state", () => { // Can't fully test drag state but can at least check class presence
        renderDnd(<PlaylistCollection playlists={sampleList} />);
        const cards = screen.getAllByTestId(/playlist-card-/);
        cards.forEach((card) => {
            expect(card.className).toMatch(/opacity-(50|100)/);
        });
    });


    it("handles undefined playlists safely", () => {
        renderDnd(<PlaylistCollection playlists={undefined as any} />);
        expect(screen.queryByTestId(/playlist-card-/)).toBeNull();
    });

    it("handles empty array playlists safely", () => {
        renderDnd(<PlaylistCollection playlists={[]} />);
        expect(screen.queryByTestId(/mock-card-/)).toBeNull();
    });
});
