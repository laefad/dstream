export type ClearedMediaDeviceInfo = Omit<MediaDeviceInfo, 'toJSON'>

export const useMediaDevicesStore = defineStore('mediadevicesstore', () => {

    const appAlertsStore = useAppAlertsStore()

    const audioInputs = ref<ClearedMediaDeviceInfo[]>([])
    const videoInputs = ref<ClearedMediaDeviceInfo[]>([])
    const audioOutputs = ref<ClearedMediaDeviceInfo[]>([])
    const mediaIsUnavailable = ref<boolean>(false)
    
    const selectedVideoInput = ref<ClearedMediaDeviceInfo | null>(null)
    const selectedAudioInput = ref<ClearedMediaDeviceInfo | null>(null)
    const selectedAudioOutput = ref<ClearedMediaDeviceInfo | null>(null)

    const stream = ref<MediaStream | null>(null)

    // TODO need to use navigator.permissions.query 
    // but typescript doesnt have "camera" and "microphone" type definitions, only firefox types :( 
    const checkMediaPermissions = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({audio: true, video: true})
            mediaIsUnavailable.value = false
        } catch {
            appAlertsStore.addAlert({
                type: 'warning',
                text: 'Разрешите доступ к камере и микрофону для дальнейшей работы'
            })
            mediaIsUnavailable.value = true
        }
    }

    const getMediaDevices = async () => {
        await checkMediaPermissions()
        const mediaDevices = await navigator.mediaDevices.enumerateDevices()

        const exclude = ({
            deviceId, groupId, kind, label
        }: MediaDeviceInfo): ClearedMediaDeviceInfo => ({
            deviceId, groupId, kind, label
        })

        videoInputs.value = mediaDevices.filter(mdi => mdi.kind == 'videoinput').map(exclude)
        audioInputs.value = mediaDevices.filter(mdi => mdi.kind == 'audioinput').map(exclude)
        audioOutputs.value = mediaDevices.filter(mdi => mdi.kind == 'audiooutput').map(exclude)
    }

    if (getCurrentInstance()) {
        onMounted(() => {
            // Emitted when new device connected or disconnected
            navigator.mediaDevices.addEventListener('devicechange', () => {
                getMediaDevices()
            })

            getMediaDevices()

            // watch media sources and create media stream based on them
            watch([selectedVideoInput, selectedAudioInput], async ([videoInput, audioInput]) => {
                if (videoInput != null && audioInput != null) {
                    console.log(`selected`, videoInput, audioInput)
                    stream.value = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: {
                                exact: audioInput.deviceId
                            },
                            ...audioSettings
                        },
                        video: {
                            deviceId: {
                                exact: videoInput.deviceId
                            },
                        }
                    }) ?? null
                } else {
                    stream.value = null
                }
            })

        })
    }

    return { 
        mediaIsUnavailable, 
        audioInputs, audioOutputs, videoInputs, 
        selectedVideoInput, selectedAudioInput, selectedAudioOutput,
        stream
    }
})
