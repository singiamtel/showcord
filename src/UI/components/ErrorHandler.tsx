export function ErrorHandler({error}: {error: Error}) {
    return <div className='w-full h-full flex flex-col justify-center items-center'>
        <h1 className='text-2xl font-bold'>Something went wrong</h1>
        <p className='text-lg'>{error.message}</p>
    </div>;
}

