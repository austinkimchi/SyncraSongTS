import { render } from 'vitest-browser-react'
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import Account from "../components/Account";
import Platform from "../types/platform";

import "../css/PlaylistCard.css";
import "../css/PlaylistSection.css";
import "../css/App.css";
import "../index.css"

const mockFetch = vi.fn();
vi.stubGlobal("fetch", async (input: RequestInfo, init?: RequestInit) => {
    return mockFetch(input, init);
});

describe("Account", () => {
    beforeEach(() => {
        vi.useRealTimers();
        localStorage.clear();
        mockFetch.mockReset();
    });

    function clickAvatar() {
        fireEvent.click(screen.getByTestId("account-avatar"));
    }

    it("shows unauthenticated menu with provider logins when no session", async () => {
        mockFetch.mockResolvedValueOnce({ ok: false }); // /auth/session
        render(<Account />);
        clickAvatar();
        const menu = await screen.findByRole("menu");
        expect(within(menu).getByText(/Spotify/i)).toBeInTheDocument();
        expect(within(menu).getByText(/Apple/i)).toBeInTheDocument();
        expect(within(menu).getByText(/SoundCloud/i)).toBeInTheDocument();
        expect(within(menu).getByText(/Legacy Login/i)).toBeInTheDocument();
    });

    it("shows authenticated menu with account info", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true })                 // /auth/session
            .mockResolvedValueOnce({ ok: true, json: async () => ({ userId: "austin", providers: [Platform.SPOTIFY] }) });
        render(<Account />);
        await waitFor(() => clickAvatar());
        const menu = await screen.findByRole("menu");
        expect(within(menu).getByText(/austin/i)).toBeInTheDocument();
    });

    it("handles API failures by clearing account", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true }) // /auth/session
            .mockResolvedValueOnce({ ok: false }); // /auth/users/info
        render(<Account />);
        clickAvatar();
        const menu = await screen.findByRole("menu");
        expect(within(menu).getByText(/Legacy Login/i)).toBeInTheDocument();
    });

    it("logout clears localStorage and reloads", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ userId: "austin" }) })
            .mockResolvedValueOnce({ ok: true }); // POST /auth/logout
        localStorage.setItem("user_data", "x");
        localStorage.setItem("apple-playlists", "y");
        render(<Account />);

        await waitFor(() => fireEvent.click(screen.getByTestId("account-avatar")));
        fireEvent.click(await screen.findByText(/Logout/i));

        // logout should clear the data in localstorage
        await waitFor(() => {
            expect(localStorage.getItem("user_data")).toBeNull();
            expect(localStorage.getItem("apple-playlists")).toBeNull();
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringMatching(/\/auth\/logout/),
            expect.objectContaining({ method: "POST" })
        );
    });

    it("error message shows when failed to fetch user info", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true }) // /auth/session
            .mockRejectedValueOnce(new Error("Network error"));
        render(<Account />);
        await waitFor(() => clickAvatar());
        const menu = await screen.findByRole("menu");
        expect(within(menu).getByText(/Failed to /i)).toBeInTheDocument();
    });

});
