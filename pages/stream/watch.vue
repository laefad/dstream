<script lang="ts" setup>
import { mdiDice5Outline } from '@mdi/js'

const viewerPeer = useViewerPeerStore()
const appBarStore = useAppBarStore()
const uuidGenerator = ref(new UUID())

const route = useRoute()

const uuid = ref(uuidGenerator.value.generate())

onMounted(() => {
    viewerPeer.channelId = route.query.channelId as string ?? ''
    viewerPeer.selfId = `${uuid.value}`
    appBarStore.title = `Просмотр трянсляции ${viewerPeer.channelId}`

    // page exit 
    window.addEventListener("beforeunload", async () => {
        await viewerPeer.sendDisconnectNotificationToChannel()
    })
})

onBeforeUnmount(async () => {
    // reload to another page in site
    await viewerPeer.sendDisconnectNotificationToChannel()
    viewerPeer.clear()
})

const generateUUID = () => {
    uuid.value = uuidGenerator.value.generate()
}

</script>

<template>
<VRow class="fill-height" align="center">
    <VCol>
        <VTextField
            label="Ваш uuid"
            placeholder="Введите ваш uuid"
            :append-icon="mdiDice5Outline"
            @click:append="generateUUID()"
            v-model="viewerPeer.selfId"
            disabled
        />
        <VTextField
            label="введите id стрима"
            v-model="viewerPeer.channelId"
        />
        <VBtn
            @click="viewerPeer.connectToChannel"
            text="Подключиться"
        />
    </VCol>
    <VCol>
        <Player :stream="viewerPeer.mediaStream" :key="viewerPeer.streamKey"/>
    </VCol>
</VRow>
</template>
