<script lang="ts" setup>
const appAlertsStore = useAppAlertsStore()
</script>

<template>
    <VContainer 
        id="notifications" 
        fluid 
        align="center"
    >
        <VCol cols="6">
            <VAlert
                v-for="alert in appAlertsStore.alerts"
                variant="outlined"
                :type="alert.type"
                :text="alert.text"  
            />
        </VCol>
    </VContainer>
</template>

<style lang="sass" scoped>
#notifications 
    position: absolute
    top: 0px
    transform: translateY(64px) // appbar height, maybe defined somewhere...
    z-index: 9999
    opacity: 0.7
    & > .v-col 
        max-height: 64px * 2
        overflow-x: auto
        & > .v-alert
            margin-top: 10px
        &::-webkit-scrollbar 
            display: none
</style>
