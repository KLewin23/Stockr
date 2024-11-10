import { trpc } from '@/renderer/main';
import { BoxIcon, Cross2Icon, MinusIcon } from '@radix-ui/react-icons';

const TitleBar = (): JSX.Element => {
    const minimize = trpc.minimize.useMutation();
    const killApp = trpc.killApp.useMutation();
    const toggleMaximize = trpc.toggleMaximize.useMutation();

    return (
        <div id={'titlebar'} className={'row bg-zinc-900  justify-between'}>
            <div className={'row gap-4 items-center py-2 px-4'}>
                <img src={'./icon.png'} className={'h-6'} />
                <p>Billy&apos;s Cock Management System</p>
            </div>
            <div className={'row items-center'}>
                <button
                    className={'px-4 h-full hover:bg-zinc-800'}
                    onClick={() => minimize.mutate()}
                >
                    <MinusIcon />
                </button>{' '}
                <button
                    className={'px-4 h-full hover:bg-zinc-800'}
                    onClick={() => toggleMaximize.mutate()}
                >
                    <BoxIcon />
                </button>
                <button className={'px-4 h-full hover:bg-red-600'} onClick={() => killApp.mutate()}>
                    <Cross2Icon />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
