import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Loader } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
    title: string
    description?: string
    onSubmit: () => void
    open: boolean
    onClose: () => void
    loading?: boolean
}

const AlertModal = ({ title, description, onSubmit, open, onClose, loading = false }: Props) => {

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent>

                    <DialogTitle className="mt-5.5 pb-2 text-xl font-bold text-surface-foreground dark:text-surface-foreground sm:text-2xl">
                        {title}
                    </DialogTitle>

                    <p className="mb-10 text-surface-foreground ">
                        {description}
                    </p>

                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={onClose}
                            disabled={loading}
                            variant='secondary'
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onSubmit}
                            disabled={loading}
                            variant='destructive'
                        >
                            {loading ? <Loader className='animate-spin' /> : 'Proceed'}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    )
}

export default AlertModal
