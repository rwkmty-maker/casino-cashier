"use client"

import { useEffect, useRef, useActionState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SubmitButton } from "@/components/submit-button"

interface ActionFormProps {
  action: (prevState: unknown, formData: FormData) => Promise<{ success?: boolean; message?: string; errors?: Record<string, string[]> }>
  children: React.ReactNode
  submitLabel?: string
  resetOnSuccess?: boolean
  onSuccess?: () => void
  className?: string
}

export function ActionForm({ action, children, submitLabel = "送信", resetOnSuccess, onSuccess, className }: ActionFormProps) {
  const [state, formAction] = useActionState(action, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state) return
    if (state.success) {
      toast.success("保存しました")
      if (resetOnSuccess) formRef.current?.reset()
      onSuccess?.()
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, resetOnSuccess, onSuccess])

  return (
    <form ref={formRef} action={formAction} className={className || "contents"}>
      {children}
      {state?.message && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state?.errors && (
        <div className="text-sm text-destructive">
          {Object.entries(state.errors).map(([key, errors]) => (
            <div key={key}>{errors?.join(", ")}</div>
          ))}
        </div>
      )}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  )
}
