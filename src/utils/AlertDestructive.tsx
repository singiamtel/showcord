import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';

export function AlertDestructive({ title, description }: { title: string, description: string }) {
    return (
        <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                {description}
            </AlertDescription>
        </Alert>
    );
}
