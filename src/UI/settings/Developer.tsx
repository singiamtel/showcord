import { HTMLAttributes, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { AlertDestructive } from '@/utils/AlertDestructive';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useClientContext } from '../components/single/ClientContext';

export default function DeveloperSettings(props: HTMLAttributes<'div'>) {
    const description = 'These settings are for advanced users only. Change them at your own risk.';
    const { client } = useClientContext();
    const [serverURL, setServerURL] = useState(client.settings.getServerURL());
    const [loginserverURL, setLoginserverURL] = useState(client.settings.getLoginServerURL());
    return (
        <div className={twMerge('p-8', props.className)}>
            <h2 className="text-xl pb-4">
              Developer settings
            </h2>
            <AlertDestructive title="Warning" description={description} />
            <div className="pt-4">
                <Label htmlFor="api-url">Server URL</Label>
                <Input
                    type={'url'}
                    value={serverURL}
                    placeholder={client.settings.defaultServerURL}
                    onChange={(e) => setServerURL(e.target.value)}

                />
            </div>
            <div className="pt-4">
                <Label htmlFor="api-url">Loginserver URL</Label>
                <Input
                    type={'url'}
                    value={loginserverURL}
                    placeholder={client.settings.defaultLoginServerURL}
                    onChange={(e) => setLoginserverURL(e.target.value)}
                />
            </div>
            <div className="pt-4" id="saveSettings">
                <Button onClick={() => {
                    client.settings.setServerURLs(serverURL || client.settings.defaultServerURL, loginserverURL || client.settings.defaultLoginServerURL);
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }}>
                  Save changes and refresh
                </Button>
            </div>
        </div>
    );
}
