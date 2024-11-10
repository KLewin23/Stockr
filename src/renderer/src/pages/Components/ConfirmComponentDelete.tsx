import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shadcn';

const ConfirmComponentDelete = ({ onDelete }: { onDelete: () => void }): JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant={'destructive'}>Delete Component Type</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Component Type</DialogTitle>
                </DialogHeader>
                <div className={'col gap-4'}>
                    <p className={'text-sm max-w-[400px]'}>
                        Are you sure you want to delete this component type? <br />
                        This action is permenant. You could also just go to the data folder and
                        archive the file.
                    </p>
                    <div className={'row justify-between gap-4'}>
                        <Button onClick={() => setIsOpen(false)}>
                            I changed my beta mind (Cancel)
                        </Button>
                        <Button variant={'destructive'} onClick={() => onDelete()}>
                            Delete go brrr (Yes)
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmComponentDelete;
