import manageURL from '../../utils/manageURL';
import innerText from 'react-innertext';
import { useClientContext } from '../components/single/useClientContext';
import type { ExtendedProps } from './chat';


export function RoomLink(
    props: ExtendedProps
) {
    const { client } = useClientContext();
    const key = props.key;
    delete props.key;
    return (
        <span key={key}>
            «
            <a
                href={`/${innerText(props.children)}`}
                className="text-blue-500 underline cursor-pointer"
                onClick={(e) => {
                    manageURL(e, client);
                }}
                {...props} />
            »
        </span>
    );
}
