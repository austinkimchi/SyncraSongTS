import { render } from 'vitest-browser-react'
import { within } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach, afterEach, it } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';
import userEvent from '@testing-library/user-event';


// Import types, enums, data
import { Playlist } from '../types/playlist';
import { state } from '../types/status';
import Platform, { getPlatformDisplayName } from '../types/platform';
import AppleLogo from '../assets/provider/applemusic.svg';
import SpotifyLogo from '../assets/provider/spotify.png';
import SoundCloudLogo from '../assets/provider/SoundCloud.png';


vi.mock('../types/status', () => ({
    state: {
        PENDING: "pending",
        PROCESSING: "processing",
        SUCCESS: "success",
        ERROR: "error"
    }
}));

// Assume Platform Data is correct.
vi.mock('../types/platform', () => ({
    __esModule: true,
    defaultExport: 'spotify',
    default: { SPOTIFY: 'spotify', APPLE_MUSIC: 'apple', SOUNDCLOUD: 'soundcloud' },
    getPlatformDisplayName: (platform: Platform) => {
        switch (platform) {
            case 'spotify':
                return 'Spotify';
            case 'apple':
                return 'Apple Music';
            case 'soundcloud':
                return 'SoundCloud';
            default:
                return 'Unknown';
        }
    },
    getPlatformLogo: (platform: Platform) => {
        switch (platform) {
            case 'spotify':
                return SpotifyLogo;
            case 'apple':
                return AppleLogo;
            case 'soundcloud':
                return SoundCloudLogo;
            default:
                return '';
        }
    }
}));

// Import CSS
import '../css/App.css';
import '../css/PlaylistCard.css';
import '../css/PlaylistSection.css';

function renderWithDnd(ui: React.ReactElement) {
    return render(<DndProvider backend={TestBackend}>{ui}</DndProvider>);
}

function checkAllPlNamePresent(texts: string[]) {
    texts.forEach((text) => {
        expect(screen.getByText(text)).toBeDefined();
    });
}
function checkAllPlTrackCountPresent(counts: number[]) {
    counts.forEach((count) => {
        expect(screen.getByText(`${count} songs`)).toBeDefined();
    });
}
function checkAllPlImagePresent(urls: string[]) {
    urls.forEach((url) => {
        const images = screen.getAllByRole('img');
        const found = images.some((img) => img.getAttribute('src') === url);
        expect(found).toBe(true);
    }
    );
}

// Component testing
import PlaylistCard from '../components/PlaylistCard';
import PlaylistCollection from '../components/PlaylistCollection';
import PlaylistSection from '../components/PlaylistSection';

const sampleList: Playlist[] = [
    { id: '1', name: 'Chill Vibes', trackCount: 21, platform: Platform.SPOTIFY, href: '', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200005caf330ca3a3bfaf8b18407fb33e', isPublic: false, status: state.PENDING },
    { id: '2', name: 'Sleep', trackCount: 22, platform: Platform.APPLE_MUSIC, href: '', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200005caf1cef0cee1e498abb8e74955f', isPublic: true, status: state.SUCCESS },
    { id: '3', name: 'Today\'s Top Hits', trackCount: 23, platform: Platform.SOUNDCLOUD, href: '', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67fb8200008e2c21cf047fac53f26680dcad78', isPublic: true, status: state.SUCCESS },
];

describe('PlaylistCard component', () => {
    it('properly renders PlaylistCard component', () => {
        const playlist = sampleList[0];
        const onRemove = vi.fn();
        renderWithDnd(<PlaylistCard data={playlist} onRemove={onRemove} />);
        expect(screen.getByText('Chill Vibes')).toBeDefined();
        expect(screen.getByText('21 songs')).toBeDefined();
    });
});

describe('PlaylistCollection component', () => {
    it('properly renders empty PlaylistCollection', () => {
        renderWithDnd(<PlaylistCollection playlists={[]} />);
        // expect nothing is rendered
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('properly renders PlaylistCollection with sample list', () => {
        renderWithDnd(<PlaylistCollection playlists={sampleList} />);
        checkAllPlNamePresent(sampleList.map(pl => pl.name));
        checkAllPlTrackCountPresent(sampleList.map(pl => pl.trackCount));
        checkAllPlImagePresent(sampleList.map(pl => pl.image || ''));
    });
});

describe('PlaylistSection component', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('properly renders and opens the platform dropdown', async () => {
        const TEST_PLATFORM = Platform.SPOTIFY;
        const onAddToPending = vi.fn();
        const onRefresh = vi.fn();
        const date = new Date();

        renderWithDnd(
            <PlaylistSection
                platform={TEST_PLATFORM}
                playlists={sampleList}
                lastUpdated={date}
                onAddToPending={onAddToPending}
                onRefresh={onRefresh}
            />
        );


        // initial button shows current platform
        const current_platform_display = 'Spotify';
        const control = screen.getByText(current_platform_display);
        expect(control).toBeDefined();

        await userEvent.click(control); // open menu

        const menu = await screen.findByRole('menu');
        expect(menu).toBeDefined();

        // all other platforms are shown in menu
        const withinMenu = within(menu);
        const values = Object.values(Platform) as Platform[];
        values
            .filter(p => p !== TEST_PLATFORM) // exclude current platform
            .forEach(p => {
                expect(withinMenu.getByText(getPlatformDisplayName(p))).toBeInTheDocument();
            });


        


    });
});