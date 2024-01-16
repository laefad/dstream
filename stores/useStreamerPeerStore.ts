// Types
import type { Peer, PeerJSOption, MediaConnection } from 'peerjs'
import type { PeerMessage, Leaf } from '@/utils/peerMessage'
import type { PeerTreeData } from '@/utils/avl-tree/peerTreeData'

// Utils
import { TreeChangesListener } from '@/utils/avl-tree/treeChangesListener'
import { AvlTree } from '@/utils/avl-tree/tree'

export const useStreamerPeerStore = defineStore('streamerpeerstore', () => {

    const inactivityTime = 10000

    const _peer = ref<Peer | null>(null)
    const _mediaStream = ref<MediaStream | null>(null)
    const _listener = ref<TreeChangesListener<PeerTreeData>>(
        new TreeChangesListener()
    )
    const _peerTree = ref<AvlTree<number, PeerTreeData>>(
        new AvlTree(_listener.value, reversedNumberCompare)
    )
    const _peerTreeDict = ref<Map<string, PeerTreeData>>(
        new Map<string, PeerTreeData>()
    )
    const _connectionToRoot = ref<MediaConnection | null>(null)

    // Getters/setters

    // MUST be valid with https://github.com/peers/peerjs/blob/2a816c1356228c058188274d96ed28f9dabb3f8b/lib/util.ts#L121 
    const id = computed(() => _peer.value?.id ?? null)
    const destroyed = computed(() => _peer.value?.destroyed ?? true)

    const mediaStream = computed<MediaStream | null>({
        get() {
            return _mediaStream.value
        },
        set(newMediaStream: MediaStream | null) {
            _mediaStream.value = newMediaStream
            _callRootPeer(_peerTree.value.root?.value.id ?? null)
        }
    })

    // Setups 

    const _createPeerJs = async (id: string, options: PeerJSOption) => {
        if (_peer.value)
            _peer.value.destroy()

        const Peer = await (await import('peerjs')).Peer

        _peer.value = new Peer(id, options)
        _setupPeer()
        _setupListener()
    }

    const _setupPeer = () => {
        if (_peer.value) {
            _peer.value.on('connection', (connection) => {

                console.log(`${connection.peer} connected to streamer`)
    
                const anotherPeer: PeerTreeData = {
                    id: connection.peer,
                    connectionTime: Date.now()
                }
    
                const inactivityTimeout = setTimeout(() => {
                    if (_peerTreeDict.value.has(connection.peer)) {
                        console.log(`${connection.peer} sended disconnect notification`)
                        _onPeerDisconnect(_peerTreeDict.value.get(connection.peer)!)
                    } else {
                        connection.close()
                        console.log(`${connection.peer} disconnected via inactivity`)
                    }
                }, inactivityTime)
    
                connection.on('data', (data) => {
                    console.log(`Message from ${connection.peer} recieved`)
                    const typedData = data as PeerMessage
    
                    if (typedData.type == 'connectToStream') {
                        _onPeerConnect(anotherPeer)
                    } else if (typedData.type == 'peerDisconnected') {
                        const peer = _peerTreeDict.value.get(typedData.peerId)
                        if (peer) {
                            _onPeerDisconnect(peer)
                        }
                    }
    
                    clearTimeout(inactivityTimeout)
                    connection.close()
                })
    
            })
        }
    }

    const _setupListener = () => {
        const changesStore: {
            root: string | null
            leafs: Map<string, {
                left: string | null
                right: string | null
            }>
        } = {
            root: null,
            leafs: new Map()
        }

        const clearStore = () => {
            changesStore.root = null
            changesStore.leafs = new Map()
        }

        _listener.value.on('root', (source, data) => {
            if (data == null)
                console.log('Root is null')
            changesStore.root = data?.id ?? null
        })

        _listener.value.on('left', (source, data) => {
            if (changesStore.leafs.has(source!.id)) {
                changesStore.leafs.get(source!.id)!.left = data?.id ?? null 
            } else {
                changesStore.leafs.set(source!.id, {
                    left: data?.id ?? null,
                    right: null
                })
            }
        })

        _listener.value.on('right', (source, data) => {
            if (changesStore.leafs.has(source!.id)) {
                changesStore.leafs.get(source!.id)!.right = data?.id ?? null 
            } else {
                changesStore.leafs.set(source!.id, {
                    right: data?.id ?? null,
                    left: null
                })
            }
        })

        _listener.value.on('updated', () => {
            for (const [peerId, leaf] of changesStore.leafs) {
                if (leaf.left)
                    _sendPeerNewConnectionInfo(peerId, leaf.left, 'left')
                if (leaf.right)
                    _sendPeerNewConnectionInfo(peerId, leaf.right, 'right')
            }
            if (changesStore.root)
                _callRootPeer(changesStore.root)
            clearStore()
        })
    }

    // Actions

    const _onPeerConnect = (anotherPeer: PeerTreeData) => {
        console.log(`${anotherPeer.id} connected to network`)
        _peerTreeDict.value.set(anotherPeer.id, anotherPeer)
        _peerTree.value.insert(anotherPeer.connectionTime, anotherPeer)
        printState()
    }

    const _onPeerDisconnect = (anotherPeer: PeerTreeData) => {
        console.log(`${anotherPeer.id} disconnected from network`)
        _peerTreeDict.value.delete(anotherPeer.id)
        _peerTree.value.delete(anotherPeer.connectionTime)
        printState()
    }

    const _sendPeerNewConnectionInfo = (
        anotherPeerId: string, 
        peerIdToConnect: string, 
        leaf: Leaf
    ) => {
        if (_peer.value) {
            console.log(`Send ${anotherPeerId} info about need to connect ${peerIdToConnect} '${leaf}'`)
            const connection = _peer.value.connect(anotherPeerId)
            connection.on('open', () => {
                connection.send({
                    type: 'newPeerLeaf',
                    peerId: peerIdToConnect,
                    leaf
                } as PeerMessage)
                console.log(`Message 'newPeerLeaf' sended to '${anotherPeerId}' with '${peerIdToConnect}' '${leaf}'`)
            })
            printState()
        }
    }

    const _callRootPeer = (rootPeerId: string | null) => {
        if (_peer.value) {
            if (
                mediaStream.value != null && 
                rootPeerId != null
            ) {
                console.log(`Call root peer ${rootPeerId}`)
                _connectionToRoot.value?.close()
                _connectionToRoot.value = _peer.value.call(rootPeerId, mediaStream.value, {
                    sdpTransform
                })

                _connectionToRoot.value.on('close', () => {
                    if (_peerTreeDict.value.has(rootPeerId)) {
                        _onPeerDisconnect(_peerTreeDict.value.get(rootPeerId)!)
                    }
                })

            } else {
                console.log(`No peers here`)
                _connectionToRoot.value?.close()
                _connectionToRoot.value = null
            }
        }
    }

    // Public actions 

    const createPeerWithId = async (id: string) => {
        await _createPeerJs(id, defaultPeerOptions)
    }

    const disconnect = () => {
        _peer.value?.destroy()
        // cleanup
        mediaStream.value = null
        _connectionToRoot.value = null
        _peerTreeDict.value = new Map<string, PeerTreeData>()
        _listener.value = new TreeChangesListener()
        _peerTree.value = new AvlTree(_listener.value, reversedNumberCompare)
        _peer.value = null
    }

    // Debug only 

    const printState = () => {
        console.log(
            JSON.stringify(
                _peerTree.value, 
                ['_left', '_right', '_root', 'value', 'id'],
                '\t'
            )
        )
    }

    return { mediaStream, id, destroyed, createPeerWithId, disconnect }
})
