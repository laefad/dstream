<script lang="ts" setup>
import { mdiHome } from '@mdi/js'

const appBarStore = useAppBarStore()
</script>

<template>
    <VAppBar>
        <VBtn
            :icon="mdiHome"
            to="/"
        />
        <VBtn
            to="/stream/broadcast"
            text="Начать трансляцию"
        />
        <VBtn
            to="/stream/watch"
            text="Смотреть трансляцию"
        />

        <VSpacer/>
        <VAppBarTitle 
            align="center"
            :text="appBarStore.title"    
        />
        <VSpacer/>
    </VAppBar>
</template>
