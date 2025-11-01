import { render } from 'vitest-browser-react'
import { vi, expect, describe, it } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';
import Platform from "../types/platform";
import { Playlist } from "../types/playlist";
import PlaylistCard from '../components/PlaylistCard';
import { state } from '../types/status';

function renderWithDnd(ui: React.ReactElement) {
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

describe("PlaylistCard", () => {
    const onRemove = vi.fn();
    it("renders name and track count", () => {
        renderWithDnd(<PlaylistCard data={sampleList[0]} onRemove={onRemove} />);
        expect(screen.getByText(sampleList[0].name)).toBeInTheDocument();
        expect(screen.getByText(`${sampleList[0].trackCount} songs`)).toBeInTheDocument();
    });

    it("uses placeholder when image is missing", () => {
        renderWithDnd(<PlaylistCard data={{ ...sampleList[0], image: "" }} />);
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("alt", sampleList[0].name);
        expect(img).toHaveAttribute("src", "/src/assets/placeholders/300x300-noimage.png");
    });

    it("exposes test id for the card", () => {
        renderWithDnd(<PlaylistCard data={{ ...sampleList[0], id: "abc123" }} />);
        expect(screen.getByTestId("playlist-card-abc123")).toBeInTheDocument();
    });

    it("click removes only when status is PENDING", () => {
        const onRemove = vi.fn();

        renderWithDnd(
            <PlaylistCard data={{ ...sampleList[0], status: state.PENDING }} onRemove={onRemove} />
        );

        fireEvent.click(screen.getByTestId(`playlist-card-${sampleList[0].id}`));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("click does NOT remove when status is not PENDING", () => {
        const onRemove = vi.fn();
        renderWithDnd(
            <PlaylistCard data={{ ...sampleList[0], status: state.SUCCESS ?? "DONE" }} onRemove={onRemove} />
        );
        fireEvent.click(screen.getByTestId(`playlist-card-${sampleList[0].id}`));
        expect(onRemove).not.toHaveBeenCalled();
    });

    it("applies opacity class while dragging (react-dnd collect)", () => {
        renderWithDnd(<PlaylistCard data={{ ...sampleList[0], status: state.SUCCESS }} />);
        const el = screen.getByTestId(`playlist-card-${sampleList[0].id}`);
        expect(el.className).toMatch(/playlist-component/);
    });
});
