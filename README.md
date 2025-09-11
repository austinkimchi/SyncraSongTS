# SyncraSong Web App
### This is a public repository, subject to change.
**This repository is not for distribution or derivations.**

This project is currently in development.
Hosted on: [https://syncrasong.austin.kim/](https://syncrasong.austin.kim/)

### Description
SyncraSongTS is a front-end web application, utilizing the [SyncraSongAPI](https://github.com/austinkimchi/SyncraSongAPI) (**private repository** for security purposes). This full-stack application utilizes the MERN stack, utilizing MongoDB, Express.js, React, and Node.js. <be>
Utilized OpenAI Codex for early UI re-design.

> [!Important]
> You need to be an active Apple Music Subscriber to link your playlist and account to this web app.

### TODO:
- [ ] Transfer queuing system/load balancing (In-progress)
- [ ] Spotify: Fetch user library instead of only their playlists. This would increase the number of "playlists" transferable. (Blends, Liked Songs, Etc.)
- [ ] Pane switching: Select the platform on either the left or right pane instead of hard-fixing it
- [ ] Add user settings
- [ ] More platforms (Tidal, Youtube Music, Soundcloud, etc.)
- [ ] UI rebrand (once code works)
More to come...

### Completed Tasks:
- [x] Implement playlist fetching for service-linked account (Aug 2024)
- [x] Access to RESTAPI for basic functions: get userID, session token (Sep 2024)
- [x] UI elements dragging & clicking functionality (Apr 2025)
- [x] Fetch OAuth 2.0, served by back-end API (Apr 2025)
- [x] Transfer functionality: **Spotify** to **Apple Music** (Jun 2025)
- [x] Dark and Light mode implementation (Jun 2025)
- [x] Transfer functionality: **Apple Music** to **Spotify** (Jul 2025)
- [x] Allow any user to create an account (Jul 2025/Regressing change)

### Current State
<!-- image at ./src/assets/images/Screenshot 2024-12-29 222231.png-->
![Current State](./src/assets/images/SyncraSong_home.png)

>[!Tip]
> Users can click or drag playlists across the platform seamlessly. <br/>
> The yellow box is the staging area before they confirm to transfer.
![Current State](./src/assets/images/SyncraSong_pending.png)

>[!Note]
> If songs are cached: On average, a playlist of 100 songs takes **6 seconds** to transfer. (Either way, due to caching) <br/>
> If songs are uncached: On average, a playlist of 100 songs will take **41 seconds** to transfer. (Spotify->Apple 29 seconds, Apple->Spotify 53 seconds) <br/>

### Contributor(s)
[Austin Kim](https://github.com/austinkimchi)

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
