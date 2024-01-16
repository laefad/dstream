export type Alert = {
    // copy paste types from Vuetify can be changed
    type: "error" | "success" | "warning" | "info"
    text: string
}

const ALERTS_FADE_TIME = 10000

export const useAppAlertsStore = defineStore('appalertsstore', () => {
    const alerts = ref<Array<Alert>>([])

    const addAlert = (alert: Alert) => {
        alerts.value = [...alerts.value, alert]
        setTimeout(() => {
            alerts.value = alerts.value.slice(1)
        }, ALERTS_FADE_TIME)
    }

    return {
        alerts,
        addAlert
    }
})
