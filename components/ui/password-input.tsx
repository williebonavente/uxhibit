import * as React from 'react'
import { Input } from './input'
import { IconEye, IconEyeOff } from '@tabler/icons-react';

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ ...props }, ref) => {
        const [show, setShow ] = React.useState(false)
        return (
            <div className="relative">
                <Input
                    {...props}
                    ref={ref}
                    type={show ? 'text' : 'password'}
                />
                <button
                    type="button"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-sx ${show ? 'text-accent dark:text-white' : 'border-white/20 text-accent dark:text-gray-500'}`}
                    onClick={() => setShow((s) => !s)}
                >
                    {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
            </div>
        )
    }
)

PasswordInput.displayName = 'PasswordInput'