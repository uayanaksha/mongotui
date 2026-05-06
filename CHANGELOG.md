CHANGELOG
=========

[1.0.0](https://github.com/uayanaksha/mongotui/releases/tag/1.0.0) ~ 2026-05-07
-------------------------------------------------------------------------------

### Added

*Client*:
- root: renderScreen manages page position according to AppState
- input handle : hjkl, ←↑↓→, enter, Double ESC, TAB control
- loading page: on AppState loading
- error page: on error, reset to prev page
- layout manage: useTerminalSize method handles interactive size
- current state: read-only ops over db

*Server*:
- config: load, save, and validate uri
- DB: connect, disconnect, list all
- collections: list all
- docs: list all, get count
