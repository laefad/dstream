<script lang="ts" setup>
const video = ref<HTMLVideoElement | null>(null)

const props = withDefaults(defineProps<{
    stream: MediaStream | null
    placeholder?: string
}>(), {
    stream: null,
    placeholder: '/images/placeholder.png'
})

onMounted(() => {
    if (video.value) {
        video!.value.srcObject = props.stream
    } else {
        const unwatch = watch(video, (video) => {
            video!.srcObject = props.stream
            console.log(props.stream)
            unwatch()
        })
    }
})
</script>

<template>
<VContainer fluid class="d-flex justify-center align-center">
    <video
        v-if="props.stream" 
        ref="video"
        controls 
        autoplay 
        muted
    ></video>
    <VImg
        v-else
        :src="props.placeholder!"
    ></VImg>
</VContainer>
</template>

<style lang="sass" scoped>
video
    max-height: 100%
    max-width: 100%
</style>
