import type { PeerJSOption } from 'peerjs'

// TODO add config via env
export const defaultPeerOptions: PeerJSOption = {
    debug: 0,
    host: "localhost",
    port: 9000,
    path: "/myapp"
}
