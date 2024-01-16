// Types
import type { Leaf, PeerMessage } from '@/utils/peerMessage'
import type { Peer, MediaConnection, PeerJSOption } from 'peerjs'

export const useViewerPeerStore = defineStore('viewerpeerstore', () => {

    const _peer = ref<Peer | null>()

    const _connections = reactive<{
        left: MediaConnection | null,
        right: MediaConnection | null
    }>({
        left: null,
        right: null
    })

    const _rootConnection = ref<MediaConnection | null>(null)

    const _mediaStream = ref<MediaStream | null>(null)

    // MUST be valid with https://github.com/peers/peerjs/blob/2a816c1356228c058188274d96ed28f9dabb3f8b/lib/util.ts#L121
    const selfId = ref("")
    // MUST be valid with https://github.com/peers/peerjs/blob/2a816c1356228c058188274d96ed28f9dabb3f8b/lib/util.ts#L121
    const channelId = ref("")
    const options = ref<PeerJSOption>(defaultPeerOptions)
    // For video-player refresh trigger after after media source change
    const streamKey = ref<string>("")
    const mediaStream = computed<MediaStream | null>({
        get() {
            return _mediaStream.value
        },
        set(newMediaStream: MediaStream | null) {
            _mediaStream.value = newMediaStream
            streamKey.value = `${Date.now()}:${Math.random()}`
            if (_connections.left) {
                _callLeafPeer(_connections.left.peer, 'left')
            }
            if (_connections.right) {
                _callLeafPeer(_connections.right.peer, 'right')
            }
        }
    })

    const connectToChannel = async () => {
        if (_peer.value)
            _peer.value.destroy()
        await _createPeerJs(selfId.value, options.value)
        if (channelId.value != "") {
            _connectToChannel()
        }
    }

    // only selfId and options saved
    const clear = () => {
        channelId.value = ""
        _connections.left?.close()
        _connections.right?.close()
        _connections.left = null
        _connections.right = null
        _rootConnection.value?.close()
        _rootConnection.value = null
        mediaStream.value = null
        streamKey.value = ""

        if (_peer.value)
            _peer.value.destroy()
    }

    const _createPeerJs = async (id: string, options: PeerJSOption) => {
        // Destroy previous peer 
        if (_peer.value)
            _peer.value.destroy()

        const Peer = await (await import('peerjs')).Peer

        _peer.value = new Peer(id, options)
    }

    const _connectToChannel = () => {
        if (_peer.value) {
            _sendRequestToChannel()

            // wait somebody call us with stream media 
            _peer.value.on('call', (mediaConnection) => {

                console.log(`Viewer called by ${mediaConnection.peer}`)

                _rootConnection.value?.close()
                _rootConnection.value = mediaConnection

                // close leaf connection if this is new root 
                if (mediaConnection.peer == _connections.left?.peer) {
                    _connections.left.close()
                    _connections.left = null
                }
                if (mediaConnection.peer == _connections.right?.peer) {
                    _connections.right.close()
                    _connections.right = null
                }
                
                mediaConnection.on('stream', (stream) => {
                    console.log(`Stream recieved from ${mediaConnection.peer}`)
                    mediaStream.value = stream
                })

                mediaConnection.on('close', () => {
                    console.log(`Stream ended from root`)
                    mediaStream.value = null
                    _rootConnection.value = null
                })

                mediaConnection.answer(undefined, {
                    sdpTransform
                })
                printState()

            })

            _peer.value.on('connection', (connection) => {

                console.log(`${connection.peer} connected to viewer`)

                connection.on('data', (data) => {
                    console.log(`Message from ${connection.peer}`)
                    const typedData = data as PeerMessage

                    if (typedData.type == 'newPeerLeaf') {
                        _callLeafPeer(typedData.peerId, typedData.leaf)
                    }

                    connection.close()
                })
            })
        }
    }

    const sendDisconnectNotificationToChannel = () => {
        return new Promise((resolve, reject) => {
            if (_peer.value) {
                console.log(`Send disconnect notification to channel ${channelId.value}`)

                // Will be closed by streamer pier
                const connection = _peer.value.connect(channelId.value)

                connection.on('open', () => {
                    connection.send({
                        type: 'peerDisconnected',
                        peerId: selfId.value
                    } as PeerMessage)
                })
                connection.on('close', () => resolve(null))
            } else {
                reject()
            }
        })
    }

    const _sendRequestToChannel = () => {
        if (_peer.value) {
            console.log(`Send request to channel ${channelId.value}`)

            // Will be closed by streamer pier
            const connection = _peer.value.connect(channelId.value)

            connection.on('open', () => {
                console.log('connection opened with streamer')
                connection.send({
                    type: 'connectToStream'
                } as PeerMessage)

                console.log(`Message sended to ${channelId.value}`)
            })
        }
    }

    const _sendNotifyAboutDisconnect = (disconnectedPeerId: string) => {
        if (_peer.value) {
            console.log(`Send notify about '${disconnectedPeerId}' disconnected from channel '${channelId.value}'`)

            // Will be closed by streamer pier
            const connection = _peer.value.connect(channelId.value)

            connection.on('open', () => {
                connection.send({
                    type: 'peerDisconnected',
                    peerId: disconnectedPeerId
                } as PeerMessage)

                console.log(`Message 'peerDisconnected' from '${disconnectedPeerId}' sended to channel '${channelId.value}'`)
            })
        }
    }

    const _callLeafPeer = (leafPeerId: string, leafType: Leaf) => {
        if (_peer.value) {
            console.log(`Viewer call ${leafType} leaf '${leafPeerId}'`)

            if (mediaStream.value) {
                const mediaConnection = _peer.value.call(leafPeerId, mediaStream.value,{
                    sdpTransform
                })
                _connections[leafType] = mediaConnection

                mediaConnection.on('close', () => {
                    console.log(`${leafType} leaf '${leafPeerId}' diconnected`)
                    _connections[leafType] = null
                    _sendNotifyAboutDisconnect(leafPeerId)
                })

                printState()
            } else {
                console.log(`NO MEDIA STREAM!`)
            }
        }
    }

    //debug only
    const printState = () => {
        console.log({
            id: _peer.value?.id ?? null,
            root: _rootConnection.value?.peer ?? null,
            left: _connections.left?.peer ?? null,
            right: _connections.right?.peer ?? null
        })
    }

    return { 
        selfId, channelId, options, mediaStream, streamKey, 
        clear, connectToChannel, sendDisconnectNotificationToChannel 
    }
})
