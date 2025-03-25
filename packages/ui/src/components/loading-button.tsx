import React from 'react'
import { Button } from "ui/components/button"
import { Loader2 } from 'lucide-react'
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "ui/components/button"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    isLoading: boolean
}

export default function LoadingButton({ isLoading = false, disabled, children, variant = "default", ...props }: LoadingButtonProps) {
    return (
        <Button
            variant={variant}
            disabled={disabled || isLoading}
            className="flex justify-center items-center space-x-2 min-w-[120px]"
            {...props}
        >
            {isLoading && <Loader2 className="mr-[6px] w-4 h-4 animate-spin" />}
            {children}
        </Button>
    )
}