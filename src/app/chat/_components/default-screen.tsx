import Logo from '@/components/Logo'
import React from 'react'

const DefaultScreen = () => {
    return (
        <div className="flex-1 flex justify-center items-center px-4 py-6 space-y-4">

            <div className='flex flex-col items-center justify-center gap-4 opacity-50' >
                <Logo />
                <h2 className="text-3xl text-muted-foreground ">Welcome to LegalEase</h2>
            </div>

        </div>
    )
}

export default DefaultScreen