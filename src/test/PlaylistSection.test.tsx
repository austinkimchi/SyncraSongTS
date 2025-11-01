import React from "react";
import { render } from 'vitest-browser-react'
import { screen, fireEvent, within } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { TestBackend } from "react-dnd-test-backend";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlaylistSection from "../components/PlaylistSection";

import Platform, { getPlatformDisplayName } from "../types/platform";
import { state } from "../types/status";
import { Playlist } from "../types/playlist";

import "../css/PlaylistCard.css";
import "../css/PlaylistSection.css";
import "../css/App.css";

function renderDnd(ui: React.ReactElement) {
    return render(<DndProvider backend={TestBackend}>{ui}</DndProvider>);
}

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

describe("PlaylistSection", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("shows provider logo + display name", () => {
        renderDnd(
            <PlaylistSection
                platform={Platform.SPOTIFY}
                playlists={[]}
                onRefresh={() => { }}
                onAddToPending={() => { }}
            />
        );
        expect(screen.getByAltText(/spotify logo/i)).toBeInTheDocument();
        expect(screen.getByText(getPlatformDisplayName(Platform.SPOTIFY))).toBeInTheDocument();
    });

    it("opens MUI menu and lists other platforms", () => {
        renderDnd(
            <PlaylistSection
                platform={Platform.APPLE_MUSIC}
                playlists={[]}
                onRefresh={() => { }}
                onAddToPending={() => { }}
            />
        );
        // click header to open menu
        fireEvent.click(screen.getByRole("heading", { level: 2 }));
        const menu = screen.getByRole("menu");
        // Should include Spotify / SoundCloud but not Apple (current)
        expect(within(menu).queryByText(/Apple Music/i)).toBeNull();
        expect(within(menu).getByText(/Spotify/i)).toBeInTheDocument();
        expect(within(menu).getByText(/SoundCloud/i)).toBeInTheDocument();
    });

    it("shows last updated when provided", () => {
        const d = new Date();
        renderDnd(
            <PlaylistSection
                platform={Platform.SPOTIFY}
                playlists={[]}
                lastUpdated={d}
                onRefresh={() => { }}
                onAddToPending={() => { }}
            />
        );
        expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });

    it("hide refresh button when logged out", () => {
        // logged out
        renderDnd(
            <PlaylistSection
                platform={Platform.SPOTIFY}
                playlists={[]}
                onRefresh={() => { }}
                onAddToPending={() => { }}
            />
        );
        // not be visible
        expect(screen.queryByText("Refresh")).toBeNull();
    });

    it("shows refresh button when logged in", () => {
        // logged in
        localStorage.setItem("token", "t");
        renderDnd(
            <PlaylistSection
                platform={Platform.SPOTIFY}
                playlists={[]}
                onRefresh={() => { }}
                onAddToPending={() => { }}
            />
        );
        expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    it("drop accepts playlist from different provider and calls onAddToPending", () => {
        const onAdd = vi.fn();
        renderDnd(
            <PlaylistSection
                platform={Platform.APPLE_MUSIC}
                playlists={sampleList}
                onRefresh={() => { }}
                onAddToPending={onAdd}
            />
        );
        // Simulate drop by calling prop directly (TestBackend drag sim is verbose)
        const pl = { id: "p1", platform: Platform.SPOTIFY } as any;
        onAdd(pl, Platform.APPLE_MUSIC);
        expect(onAdd).toHaveBeenCalledWith(pl, Platform.APPLE_MUSIC);
    });
});
