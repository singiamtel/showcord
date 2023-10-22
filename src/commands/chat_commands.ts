// TODO

const cmds = {
    'part': {
        description: 'Leave the current channel',
        clientSide: false,
        core: true,
    },
    'join': {
        description: 'Join a channel',
        clientSide: false,
        core: true,
    },
    'me': {
        description: 'Send a message in the third person',
        core: true,
        clientSide: false,
        arguments: [
            {
                name: 'message',
                description: 'The message to send',
            },
        ],
    },
    'highlight': {
        description:
      'Add a highlight word to the current channel. When someone says this word, you will be notified. (Regex is supported)',
        core: true,
        clientSide: true,
        arguments: [
            {
                name: 'word',
                description: 'The word to highlight',
            },
        ],
    },
} as const;

export default cmds;
