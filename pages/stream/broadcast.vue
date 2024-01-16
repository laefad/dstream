<script lang="ts" setup>
import { mdiDice5Outline } from '@mdi/js'

const mediaDevicesStore = useMediaDevicesStore()
const streamerPeer = useStreamerPeerStore()
const appBarStore = useAppBarStore()
const appAlertsStore = useAppAlertsStore()
const uuidGenerator = ref(new UUID())

const uuid = ref(uuidGenerator.value.generate())
const streamName = ref('')
const online = ref(false)

const id = computed(() => `${uuid.value}`)

const generateUUID = () => {
    uuid.value = uuidGenerator.value.generate()
}

onMounted(() => {
    watch(online, (isOnline) => {
        if (isOnline) {
            appBarStore.title = 'Прямой эфир'
        } else {
            appBarStore.title = 'Настройка прямого эфира'
        }
    }, {
        immediate: true
    })
})

onBeforeUnmount(() => {
    onStreamEnd()
})

const onStreamEnd = () => {
    streamerPeer.disconnect()
    online.value = false
}

const onStreamStart = async () => {
    if (mediaDevicesStore.stream != null) {
        streamerPeer.mediaStream = mediaDevicesStore.stream
        await streamerPeer.createPeerWithId(id.value)
        online.value = true
    } else {
        appAlertsStore.addAlert({
            type: 'error',
            text: 'Отсутствует медиа-поток, проверьте выбраны ли медиа-устройства.'
        })
        online.value = false
    }
}

</script>

<template>
<VRow class="fill-height" align="center">
    <VCol cols="6">
        <StreamDeviceSelector />
        <VContainer fluid>
            <VTextField
                v-model="id"
                :append-icon="mdiDice5Outline"
                @click:append="generateUUID()"
                label="Ваш индентификатор"
                placeholder="Введите свой индентификатор"
            />
            <VTextField
                v-model="streamName"
                label="Название трансляции"
                placeholder="Введите название трансляции"
            />
        </VContainer>
        <VRow justify="center">
            <VBtn
                v-if="online"
                color="red"
                @click="onStreamEnd"
                text="Закончить трансляцию"
            />
            <VBtn 
                v-else
                color="green" 
                @click="onStreamStart"
                text="Начать трансляцию"
            />
        </VRow>
    </VCol>
    <VCol cols="6">
        <p class="text-center text-h3">
            Предпросмотр
        </p>
        <Player :stream="mediaDevicesStore.stream" :key="mediaDevicesStore.stream?.id"/>
    </VCol>
</VRow>
</template>
