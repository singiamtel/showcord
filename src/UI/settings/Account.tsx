
import { HTMLAttributes, useState } from 'react';
import { useClientContext } from '../components/single/ClientContext';
import { cn } from '@/lib/utils';
import { Username } from '../components/Username';
import { Button } from '@/components/ui/button';

export default function AccountSettings(props: Readonly<HTMLAttributes<'div'>>) {
    const { client } = useClientContext();
    const [username] = useState(client.username);
    return (
        <div className={cn('p-8', props.className)}>
            <h2 className="text-xl">
              Account settings
            </h2>

            <div id="account" className="mt-4">
                {username ? (
                    <>
                        <div>
                            <span className='p-1 rounded border'><Username onClick={() => {}} user={client.username} /></span>
                        </div>

                        <Button variant="destructive" className='mt-4' onClick={() => {
                            client.logout();

                            setTimeout(() => {
                                window.location.reload();
                            }, 500);
                        }}>
                    Logout
                        </Button>
                    </>
                ) :
                    (
                        <div className='flex flex-col gap-2'>
                            Not logged in
                        </div>
                    )}
            </div>
        </div>
    );
}
