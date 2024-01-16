import type { ComputedRef, Ref } from 'vue'
import { isReadonly, isRef } from 'vue'

export const getValue = <T>(
    obj: T | Ref<T> | ComputedRef<T>
) => isReadonly(obj) // this is a computed ref without a setter? 
    ? (obj as ComputedRef<T>).value 
    : isRef(obj) // or this is a computed ref with a setter ~ Ref  
        ? (obj as Ref<T>).value 
        : obj
