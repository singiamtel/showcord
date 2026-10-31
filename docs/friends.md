# Friends list compatibility

Home requests `/crq friends` once for the current named user and when Refresh friends is clicked. It uses the existing Showdown socket, query handlers, username trainer card, and PM action. There is no polling, persistence of friends data, or additional service.

## Deployment check (2026-10-31)

- Showcord's default endpoint is `wss://sim3.psim.us:443/showdown/websocket` (`Settings.defaultServerURL`); users can configure another server.
- A live guest connection returned `|queryresponse|friends|null`.
- A deliberately unknown CRQ returned `null` too. A guest `null` alone therefore does **not** establish support or identify why access was denied.
- `/version` on that endpoint reported `0.11.11 (commit 2e0a95137)`. [That commit](https://github.com/smogon/pokemon-showdown/commit/2e0a95137) is five commits ahead of, and includes, [PR #12055's merge](https://github.com/smogon/pokemon-showdown/pull/12055). The [deployed revision's handler](https://github.com/smogon/pokemon-showdown/blob/2e0a95137/server/chat-plugins/friends.ts#L245) contains `/crq friends`.
- The handler requires SQLite friends support, an autoconfirmed user, a trustable connection, and no applicable account locks. It returns `null` if any of these checks fail.

This verifies deployed **code**, plus the guest response, not a successful authenticated friends lookup or the production feature flags. No authenticated account was available for a live positive test. Eligible accounts can use the integration when the handler permits access; other/custom servers safely show an unavailable state. Do not infer broad rollout from the upstream merge.

## Response and lifecycle

An array is a success, including `[]` for no friends. Entries require a canonical `userid`, a matching display `name`, boolean `online`, string `status`, and nonnegative finite `last_login` (or `null`, possible from the database LEFT JOIN). Unknown additional fields are accepted; duplicate IDs are collapsed. Invalid JSON or entries produce a recoverable error instead of an empty list.

`online` controls presence; `busy` and `idle` add useful labels for connected users. Names open the existing trainer card; Message opens the existing PM room. Last-login timestamps are deliberately not displayed: zero can mean hidden/unknown, and the query does not supply a separate visibility flag.

Only one request can be outstanding. Concurrent consumers share it. Requests settle after ten seconds, on logout, identity change, or socket closure. Since the protocol has no request IDs, a cancelled/timed-out request retains its slot until its late reply is discarded or the connection closes. Refresh cannot issue another request into that ambiguous slot; reconnecting permits a fresh request if a server never replies. Old account data disappears immediately, and unmounted UI consumers ignore late results.

## Manual authenticated smoke test

1. Log in to Showcord with an autoconfirmed account that has friends. Check online/offline and busy/idle labels against Showdown; use Refresh after a presence change.
2. Click a friend's name to open the trainer card and Message to open their PM without sending a message.
3. Check an eligible account with no friends, an ineligible account, and a server without this CRQ. Empty and unavailable states must differ.
4. Log out, change accounts, and reconnect while a request is pending. Previous-account friends must never appear for the new account.
