export function ErrorHandler({ error }: {error: unknown}) {
    const message = error instanceof Error ? error.message : String(error);
    return <div className='w-full h-full flex flex-col justify-center items-center'>
        <h1 className='text-2xl font-bold'>Something went wrong</h1>
        <p className='text-lg'>{message}</p>
    </div>;
}

