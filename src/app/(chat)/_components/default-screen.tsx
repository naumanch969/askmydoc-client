import Logo from '@/components/Logo'
import { Session } from '@/lib/interfaces'
import React from 'react'

const DefaultScreen = ({ selectedSession }: { selectedSession: Session }) => {
    return (
        <div className="flex-1 flex justify-center items-center px-4 py-6 space-y-4">

            <div className='flex flex-col items-center justify-center gap-4 opacity-50' >
                <Logo disabled />
                <h2 className="text-3xl text-muted-foreground text-center ">Chat with {`"${selectedSession?.title}"`}</h2>
            </div>

        </div>
    )
}

export default DefaultScreen