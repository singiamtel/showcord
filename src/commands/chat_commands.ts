// each command is an object with a name, description, arguments, and if they are core commands or not

type ChatCommand = {
    name: string
    description: string
    core: boolean
    arguments?: {
        name: string
        description: string
    }[]
}

const cmds : ChatCommand[] = [
    {
        name: 'part',
        description: 'Leave the current channel',
        core: true,
    },
    {
        name: 'join',
        description: 'Join a channel',
        core: true,
    },
    {
        name: 'me',
        description: 'Send a message in the third person',
        core: true,
        arguments: [
            {
                name: 'message',
                description: 'The message to send',
            },
        ],
    },
    {
        name: 'highlight',
        description: 'Add a highlight word to the current channel. When someone says this word, you will be notified. (Regex is supported)',
        core: true,
        arguments: [
            {
                name: 'word',
                description: 'The word to highlight',
            },
        ],
    },
];

export default cmds;
