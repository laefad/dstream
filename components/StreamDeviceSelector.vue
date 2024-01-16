<script lang="ts" setup>
const mediaDevicesStore = useMediaDevicesStore()
</script>

<template>
<VContainer fluid>
    <ClientOnly>
        <VSelect
            label="Выберите источник видео"
            v-model="mediaDevicesStore.selectedVideoInput"
            :items="mediaDevicesStore.videoInputs"
            item-title="label"
            item-value="deviceId"
            return-object
        ></VSelect>
        <VSelect
            label="Выберите источник аудио"
            v-model="mediaDevicesStore.selectedAudioInput"
            :items="mediaDevicesStore.audioInputs"
            item-title="label"
            item-value="deviceId"
            return-object
        ></VSelect>
        <VSelect
            label="Выберите устройство вывода аудио(неактивно)"
            v-model="mediaDevicesStore.selectedAudioOutput"
            :items="mediaDevicesStore.audioOutputs"
            item-title="label"
            item-value="deviceId"
            return-object
        ></VSelect>
    </ClientOnly>
</VContainer>
</template>
