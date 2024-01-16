<script lang="ts" setup>
const appBarStore = useAppBarStore()

onMounted(() => {
    appBarStore.title = 'Текущие трансляции'
})
</script>

<template>
<VContainer fluid class="fill-height">
    <VRow>
        <VCol
            cols="12"
        >
            <p class="text-h5 text-center">На текущий момент нет активных трансляций</p>
            <p class="text-h5 text-center">сюда ссылку на трансляцию</p>
        </VCol>
    </VRow>
</VContainer>
</template>
