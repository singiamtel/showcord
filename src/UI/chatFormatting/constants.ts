import manageURL from '../../utils/manageURL';

export const options = {
    defaultProtocol: 'https',
    target: '_blank',
    attributes: {
        onClick: manageURL,
        className: 'text-blue-500 underline cursor-pointer',
    },
};
